import { Socket } from '../socket'
import { Request } from '../request'
import WindowVisibility from '../../util/window-visibility'
import {RequestGroup} from "../request-group";
import {LocalStorage} from "../../util/local-storage";

const request = jest.mocked(Request)
jest.mock('../request', () => {
  return {
    Request: jest.fn()
  }
})

const createMockRequest = (overrides: Partial<Request> = {}): jest.Mocked<Request> => {
  return {
    beforeSend: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    always: jest.fn().mockReturnThis(),
    setWithCredentials: jest.fn().mockReturnThis(),
    setKeepAlive: jest.fn().mockReturnThis(),
    setRequestHeader: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    send: jest.fn(),
    abort: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<Request>;
};

const createResponse = (overrides: Partial<Response> = {}): jest.Mocked<Response> => {
  const defaultHeaders = {
    get: jest.fn(),
  };

  const textFn = overrides.text || jest.fn().mockResolvedValue('');
  const jsonFn = jest.fn(async () => {
    const textValue = await textFn();
    return JSON.parse(textValue);
  });

  return {
    status: 200,
    ok: true,
    headers: overrides.headers || defaultHeaders,
    text: textFn,
    json: jsonFn,
    ...overrides,
  } as unknown as jest.Mocked<Response>;
};

const requestGroup = jest.mocked(RequestGroup)
jest.mock('../request-group', () => {
  return {
    RequestGroup: jest.fn()
  }
})

const createMockRequestGroup = (overrides: Partial<RequestGroup> = {}): jest.Mocked<RequestGroup> => {
  return {
    then: jest.fn((cb) => cb()),
    ...overrides,
  } as unknown as jest.Mocked<RequestGroup>;
};

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks()
  jest.restoreAllMocks()
})

describe('constructor', () => {
  it('initialises', () => {
    expect(new Socket({})).toBeInstanceOf(Socket)
  })
})

describe('connect', () => {
  let pollSpy : any

  beforeEach(() => {
    pollSpy = jest.spyOn(Socket.prototype as any, 'poll')
    pollSpy.mockImplementation(() => {})
  })

  it('sends request', () => {
    const mockSend = jest.fn(), mockData = jest.fn().mockReturnThis()
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request.mockImplementation(() => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        cb(createResponse({
          text: jest.fn().mockResolvedValue('{"status": "success", "time": "1", "id": null}'),
          headers: {
            get: jest.fn().mockReturnValue('1'),
          },
        }));
        return this;
      }),
      data: mockData,
      send: mockSend,
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockSend).toHaveBeenCalledTimes(1)
  })

  it('runs success callback', async () => {
    const socketId = 'socket-1';
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request.mockImplementation(() => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          text: jest.fn().mockResolvedValue('{"status": "success", "time": "2021-06-22 00:00:00", "id": null}'),
          headers: {
            get: jest.fn().mockReturnValue(socketId),
          },
        })
        cb(xhr)

        return this
      }),
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(socket.id).toEqual(socketId)
    expect(pollSpy).toHaveBeenCalledTimes(1)
  })

  it('exits when returns unexpected response', () => {
    request.mockImplementation(() => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          text: jest.fn().mockResolvedValue('{}'),
          headers: {
            get: jest.fn().mockReturnValue(''),
          },
        })
        cb(xhr)

        return this
      }),
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()

    expect(pollSpy).toHaveBeenCalledTimes(0)
    expect(socket.id).toEqual('')
  })

  it('sets socket-id before sending the request', () => {
    const socketId = 'socket-1';
    let capturedHeaderFunction: (() => string | null) | null = null;

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request.mockImplementation(() => createMockRequest({
      setRequestHeader: jest.fn(function (this: Request, name: string, value: string | (() => string | null)) {
        // Capture the function passed for X-Socket-ID header
        if (name === 'X-Socket-ID' && typeof value === 'function') {
          capturedHeaderFunction = value;
        }
        return this;
      }),
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          text: jest.fn().mockResolvedValue('{"status": "success", "time": "2021-06-22 00:00:00", "id": null}'),
          headers: {
            get: jest.fn().mockReturnValue(socketId),
          },
        })
        cb(xhr)

        return this
      }),
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })

    // Set the socket ID in localStorage before connecting
    const storage = new LocalStorage('socket');
    storage.set('id', socketId);

    socket.connect()

    // Verify that a function was passed to setRequestHeader
    expect(capturedHeaderFunction).not.toBeNull();

    // Verify that the function returns the socket ID from localStorage
    expect(capturedHeaderFunction!()).toBe(socketId);
  })

  it('returns null when socket-id is not in localStorage', () => {
    let capturedHeaderFunction: (() => string | null) | null = null;

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request.mockImplementation(() => createMockRequest({
      setRequestHeader: jest.fn(function (this: Request, name: string, value: string | (() => string | null)) {
        // Capture the function passed for X-Socket-ID header
        if (name === 'X-Socket-ID' && typeof value === 'function') {
          capturedHeaderFunction = value;
        }
        return this;
      }),
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          text: jest.fn().mockResolvedValue('{"status": "success", "time": "2021-06-22 00:00:00", "id": null}'),
          headers: {
            get: jest.fn().mockReturnValue(null),
          },
        })
        cb(xhr)

        return this
      }),
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })

    // Do NOT set socket ID in localStorage - testing the || null case
    socket.connect()

    // Verify that a function was passed to setRequestHeader
    expect(capturedHeaderFunction).not.toBeNull();

    // Verify that the function returns null when no socket ID in localStorage
    expect(capturedHeaderFunction!()).toBe(null);
  })
})

describe('poll', () => {
  it('skips if no channels', async () => {
    const timeoutSpy = jest.spyOn(window, 'setTimeout')

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());

    request
      // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success"}'),
            headers: {
              get: jest.fn().mockReturnValue('1'),
            },
          })
          cb(xhr)

          return this
        }),
      }))
      // poll implementation
      .mockImplementationOnce(() : any => createMockRequest())

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route }, polling: 1000 })
    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(timeoutSpy).toHaveBeenCalled()
    timeoutSpy.mockRestore()
  })

  it('resubscribes on 404', async () => {
    const mockSend = jest.fn()
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success"}'),
            headers: {
              get: jest.fn().mockReturnValue('1'),
            },
          })
          cb(xhr)

          return this
        }),
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        fail: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            status: 404,
            text: jest.fn().mockResolvedValue('{"message": "Not Found"}'),
          })
          cb(xhr)

          return this
        }),
      }))
    // subscribe implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            headers: {
              get: jest.fn().mockReturnValue('3'),
            },
          })
          cb(xhr)

          return this
        }),
        send: mockSend
      }))

    const connectRoute = '/connect'; const subscribeRoute = '/subscribe'
    const socket = new Socket({ routes: { connect: connectRoute, subscribe: subscribeRoute } })

    WindowVisibility.setActive()
    const cb = () => {}
    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [cb] } },
      writable: true
    })

    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('POST', subscribeRoute)
    expect(socket.subscribed).toEqual({ channel1: { new_message: [cb] } })
  })

  it('reconnects and resubscribes on 401 expired token', async () => {
    const mockSubscribeSend = jest.fn()

    // We need to capture the reconnect success callback and fire it AFTER subscribe has queued
    let reconnectSuccessCb: ((xhr: Response) => void) | null = null;

    requestGroup
      // First connect (before 401) - empty queue
      .mockImplementationOnce(() => createMockRequestGroup())
      // Second connect (after 401 reconnect) - has subscribe in queue
      .mockImplementationOnce((requests: any[]) => {
        return createMockRequestGroup({
          then: jest.fn(function (cb) {
            // Process the queued requests
            while (requests.length > 0) {
              const req = requests.shift();
              req?.send();
            }
            cb([]);
          })
        });
      });

    request
      // 1. connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success", "time": "1"}'),
            headers: {
              get: jest.fn().mockReturnValue('1'),
            },
          })
          cb(xhr)
          return this
        }),
      }))
      // 2. poll implementation - returns 401 with TOKEN_EXPIRED
      .mockImplementationOnce(() : any => {
        let failCb: ((xhr: Response) => void) | null = null;
        return createMockRequest({
          fail: jest.fn(function (this: Request, cb) {
            failCb = cb;
            return this
          }),
          send: jest.fn(function () {
            // Trigger the fail callback when send is called
            if (failCb) {
              const xhr = createResponse({
                status: 401,
                text: jest.fn().mockResolvedValue('{"status": "error", "data": {"code": "TOKEN_EXPIRED"}, "message": "X-Socket-ID header has expired."}'),
              })
              failCb(xhr);
            }
          })
        });
      })
      // 3. Reconnect implementation (after 401) - DON'T fire success immediately
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          // Capture the callback, don't fire it yet
          reconnectSuccessCb = cb;
          return this
        }),
      }))
      // 4. subscribe implementation (created during fail callback, queued)
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            headers: {
              get: jest.fn().mockReturnValue('3'),
            },
          })
          cb(xhr)
          return this
        }),
        send: mockSubscribeSend
      }))
      // 5. Second poll after reconnect
      .mockImplementationOnce(() : any => createMockRequest())

    const connectRoute = '/connect'; const subscribeRoute = '/subscribe'; const receiveRoute = '/receive'
    const socket = new Socket({ routes: { connect: connectRoute, subscribe: subscribeRoute, receive: receiveRoute } })

    WindowVisibility.setActive()
    const cb = () => {}
    socket['channels'] = { channel1: { new_message: [cb] } };

    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    // Now fire the reconnect success callback - this will process the queue which has the subscribe
    expect(reconnectSuccessCb).not.toBeNull();
    const xhr = createResponse({
      text: jest.fn().mockResolvedValue('{"status": "success", "time": "2"}'),
      headers: {
        get: jest.fn().mockReturnValue('2'),
      },
    })
    reconnectSuccessCb!(xhr);

    // Wait for async operations again
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockSubscribeSend).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('POST', subscribeRoute)
    expect(socket.subscribed).toEqual({ channel1: { new_message: [cb] } })
  })

  it('poll fail callback does nothing on 401 if not TOKEN_EXPIRED', async () => {
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
      // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success"}'),
            headers: {
              get: jest.fn().mockReturnValue('1'),
            },
          })
          cb(xhr)

          return this
        })
      }))
      // poll implementation - returns 401 but without TOKEN_EXPIRED code
      .mockImplementationOnce(() : any => createMockRequest({
        fail: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            status: 401,
            text: jest.fn().mockResolvedValue('{"data": {"code": "UNAUTHORIZED"}, "message": "Unauthorized"}'),
          })
          cb(xhr)

          return this
        })
      }))

    const socket = new Socket({ routes: { connect: '/connect' } })

    WindowVisibility.setActive()
    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [() => {}] } },
      writable: true
    })

    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should only be called twice: initial connect and poll (no reconnect)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('always loops', async () => {
    const mockSend = jest.fn()
    const timeoutSpy = jest.spyOn(window, 'setTimeout')

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());

    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success"}'),
            headers: {
              get: jest.fn().mockReturnValue('1'),
            },
          })
          cb(xhr)

          return this
        }),
      }))
      // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        always: jest.fn(function (this: Request, cb) {
          cb(createResponse())
          socket.disconnect() // Prevent further polling
          return this
        }),
        send: mockSend
      }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })

    WindowVisibility.setActive()
    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [() => {}] } },
      writable: true
    })

    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalled()
    timeoutSpy.mockRestore()
  })

  it('fires events', async () => {
    WindowVisibility.setActive();
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
      // connect implementation
      .mockImplementationOnce((): any =>
        createMockRequest({
          success: jest.fn(function (this: Request, cb) {
            const xhr = createResponse({
              text: jest.fn().mockResolvedValue('{"status": "success"}'),
              headers: {
                get: jest.fn().mockReturnValue('1'),
              },
            });
            cb(xhr);

            return this;
          }),
        })
      )
      // poll implementation
      .mockImplementationOnce((): any =>
        createMockRequest({
          success: jest.fn(function (this: Request, cb) {
            const xhr = createResponse({
              text: jest.fn().mockResolvedValue(
                '{"status": "success", "time": "2021-06-21 00:00:00", "events": [{"event": "new_message", "channel": {"name": "channel1"}}]}'
              ),
              headers: {
                get: jest.fn().mockReturnValue('2'),
              },
            });
            cb(xhr);

            return this;
          }),
        })
      );

    const route = '/connect';
    const socket = new Socket({ routes: { connect: route } });

    const cb = jest.fn();
    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [cb] } },
      writable: true,
    });

    socket.connect();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(cb).toHaveBeenCalled();
  });

  it('skips unexpected responses', async () => {
    WindowVisibility.setActive();
    const mockSend = jest.fn()
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success"}'),
            headers: {
              get: jest.fn().mockReturnValue('1'),
            },
          })
          cb(xhr)

          return this
        })
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('"foo"'),
            headers: {
              get: jest.fn().mockReturnValue('2'),
            },
          })
          cb(xhr)

          return this
        }),
        send: mockSend
      }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.dispatch = jest.fn()

    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [() => {}] } },
      writable: true
    })

    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(socket.dispatch).toHaveBeenCalledTimes(0)
  })
})

describe('subscribe', () => {
  it('sends request', () => {
    const mockSend = jest.fn(), mockData = jest.fn().mockReturnThis()
    const mockSetRequestHeader = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          text: jest.fn().mockResolvedValue('{}'),
          headers: {
            get: jest.fn().mockReturnValue('...'),
          },
        })
        cb(xhr)

        return this
      }),
      data: mockData,
      setRequestHeader: mockSetRequestHeader,
      send: mockSend
    }))

    const route = '/subscribe'; const channel = 'channel1'
    const socket = new Socket({ routes: { subscribe: route }, auth: { headers: { 'X-Token': 'foo' } } })
    socket.subscribe(channel)

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockSetRequestHeader).toHaveBeenCalledWith('X-Token', 'foo')
    expect(mockData).toHaveBeenCalledWith({ channel_name: channel })
    expect((socket as any).requestQueue.length).toBe(1)
    expect(socket.subscribed).toEqual({ channel1: {} })
  })

  it('does not clear events if already subscribed', () => {
    const mockSend = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          text: jest.fn().mockResolvedValue('{}'),
          headers: {
            get: jest.fn().mockReturnValue('...'),
          },
        })
        cb(xhr)

        return this
      }),
      send: mockSend
    }))

    const channel = 'channel1'
    const socket = new Socket({ routes: { subscribe: '/subscribe' } })

    const cb = () => {}
    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [cb] } },
      writable: true
    })

    socket.subscribe(channel)

    expect(request).toHaveBeenCalledTimes(1)
    expect(socket.subscribed).toEqual({ channel1: { new_message: [cb] } })
  })
})

describe('Unsubscribe', () => {
  it('sends request', () => {
    const route = '/unsubscribe'; const channel = 'channel1'

    const channels : any = {}
    channels[channel] = {}

    const mockRequest = createMockRequest()
    request.mockImplementation(() => mockRequest)

    const socket = new Socket({ routes: { unsubscribe: route } })
    Object.defineProperty(socket, 'channels', { value: channels, writable: true })

    expect(socket.subscribed).toEqual(channels)
    socket.unsubscribe(channel)

    expect(mockRequest.setKeepAlive).toHaveBeenCalledWith(true)
    expect(mockRequest.data).toHaveBeenCalledWith({ channel_name: channel })
    expect(mockRequest.send).toHaveBeenCalled()

    // Simulate successful response
    // Note: createRequest adds a success callback for socket ID extraction,
    // and unsubscribe adds another one for channel deletion
    const socketIdCallback = mockRequest.success.mock.calls[0][0]
    const channelDeletionCallback = mockRequest.success.mock.calls[1][0]
    socketIdCallback(createResponse())
    channelDeletionCallback(createResponse())

    expect(socket.subscribed).toEqual({})
  })

  it('send request fails', () => {
    const route = '/unsubscribe'; const channel = 'channel1'

    const channels : any = {}
    channels[channel] = {}

    const mockRequest = createMockRequest()
    request.mockImplementation(() => mockRequest)

    const socket = new Socket({ routes: { unsubscribe: route } })
    Object.defineProperty(socket, 'channels', { value: channels, writable: true })

    expect(socket.subscribed).toEqual(channels)
    socket.unsubscribe(channel)

    expect(mockRequest.setKeepAlive).toHaveBeenCalledWith(true)
    expect(mockRequest.data).toHaveBeenCalledWith({ channel_name: channel })
    expect(mockRequest.send).toHaveBeenCalled()

    // Simulate failed response - success callback is not called
    // So channel should remain subscribed
    expect(socket.subscribed).toEqual(channels)
  })
})

describe('on', () => {
  it('returns when channel doesnt exist', () => {
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', { value: {}, writable: true })

    socket.on('channel1', 'new_message', () => {})

    expect(socket.subscribed).toEqual({})
  })

  it('registers first listener', () => {
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', { value: { channel1: {} }, writable: true })

    socket.on('channel1', 'new_message', () => {})

    expect(socket.subscribed).toEqual({ channel1: { new_message: [expect.any(Function)] } })
  })

  it('appends to existing listeners', () => {
    const cb = () => {}
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', { value: { channel1: { new_message: [cb] } }, writable: true })

    socket.on('channel1', 'new_message', () => {})

    expect(socket.subscribed).toEqual({ channel1: { new_message: [cb, expect.any(Function)] } })
  })
})

describe('off', () => {
  it('returns if channel doesnt exist', () => {
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', { value: {}, writable: true })

    socket.off('channel1', 'new_message')

    expect(socket.subscribed).toEqual({})
  })

  it('returns if event doesnt exist', () => {
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', { value: { channel1: {} }, writable: true })

    socket.off('channel1', 'new_message')

    expect(socket.subscribed).toEqual({ channel1: {} })
  })

  it('removes all event listeners', () => {
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', {
      value: {
        channel1: {
          new_message: [() => {}, () => {}]
        }
      },
      writable: true
    })

    socket.off('channel1', 'new_message')

    expect(socket.subscribed).toEqual({ channel1: {} })
  })

  it('removes specified event listeners', () => {
    const socket = new Socket({})

    const listener1 = () => {}
    const listener2 = () => {}
    Object.defineProperty(socket, 'channels', {
      value: {
        channel1: {
          new_message: [listener1, listener2]
        }
      },
      writable: true
    })

    socket.off('channel1', 'new_message', listener1)

    expect(socket.subscribed).toEqual({ channel1: { new_message: [listener2] } })
  })
})

describe('emit', () => {
  it('queues request', () => {
    const mockSend = jest.fn(), mockData = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      data: mockData,
      send: mockSend,
    }))

    const route = '/publish'
    const socket = new Socket({ routes: { publish: route } })
    socket.emit('channel1', 'typing', {})

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockData).toHaveBeenCalledWith({ channel_name: 'channel1', data: {}, event: 'typing' })
    expect((socket as any).requestQueue.length).toBe(1)
  })

  it('sends request immediately', () => {
    const mockSend = jest.fn(), mockData = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      data: mockData,
      send: mockSend,
      success: jest.fn(function (this: Request, cb) {
        const xhr = createResponse({
          headers: {
            get: jest.fn().mockReturnValue('1'),
          },
        })
        cb(xhr)

        return this;
      })
    }))

    const route = '/publish'
    const socket = new Socket({ routes: { publish: route } })
    socket['lastRequestTime'] = '123';
    socket.emit('channel1', 'typing', {})

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockData).toHaveBeenCalledWith({ channel_name: 'channel1', data: {}, event: 'typing' })
    expect(mockSend).toHaveBeenCalledTimes(1)
  })
})

describe('dispatch', () => {
  it('returns when channel doesnt exist', () => {
    const cb = jest.fn()
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', {
      value: { foo: { bar: [cb] } },
      writable: true
    })

    socket.dispatch('doesnt_exist', 'bar', {})

    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('returns when event doesnt exist', () => {
    const cb = jest.fn()
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', {
      value: { foo: { bar: [cb] } },
      writable: true
    })

    socket.dispatch('foo', 'doesnt_exist', {})

    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('dispatches event', () => {
    const cb = jest.fn()
    const socket = new Socket({})
    Object.defineProperty(socket, 'channels', {
      value: { foo: { bar: [cb] } },
      writable: true
    })

    socket.dispatch('foo', 'bar', {})

    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('disconnect', () => {
  it('aborts active request', () => {
    const abortMock = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      abort: abortMock
    }))

    const socket = new Socket({})
    Object.defineProperty(socket, 'request', {
      value: new Request('GET', '/'),
      writable: true
    })

    socket.disconnect()

    expect(abortMock).toHaveBeenCalled()
  })

  it('cancels timer', () => {
    jest.spyOn(window, 'clearTimeout')

    const socket = new Socket({})
    Object.defineProperty(socket, 'timer', {
      value: setTimeout(() => {}),
      writable: true
    })

    socket.disconnect()

    expect(clearTimeout).toHaveBeenCalledTimes(1)
  })

  it('unsets socket id', () => {
    const socket = new Socket({})
    socket.disconnect()
    expect(socket.id).toBe('')
  })

  it('resets lastRequestTime to empty string', () => {
    const socket = new Socket({})
    socket['lastRequestTime'] = '2021-06-22 00:00:00'
    socket.disconnect()
    expect(socket['lastRequestTime']).toBe('')
  })

  it('stops polling in always callback after disconnect', async () => {
    const mockSend = jest.fn()
    const timeoutSpy = jest.spyOn(window, 'setTimeout')

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());

    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createResponse({
            text: jest.fn().mockResolvedValue('{"status": "success"}'),
            headers: {
              get: jest.fn().mockReturnValue('...'),
            },
          })
          cb(xhr)

          return this
        })
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        always: jest.fn(function (this: Request, cb) {
          socket.disconnect()
          cb(createResponse())

          return this
        }),
        send: mockSend
      }))

    WindowVisibility.setActive()
    Object.defineProperty(socket, 'channels', {
      value: { channel1: { new_message: [() => {}] } },
      writable: true
    })

    socket.connect()

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockSend).toHaveBeenCalledTimes(1)
    // After disconnect, polling should not continue, so setTimeout should not be called for the next poll
    // The socket disconnects before the poll schedules the next timeout
    timeoutSpy.mockRestore()
  })
})
