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
    setRequestHeader: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    send: jest.fn(),
    abort: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<Request>;
};

const createXhr = (overrides: Partial<XMLHttpRequest> = {}): jest.Mocked<XMLHttpRequest> => {
  return {
    ...overrides,
  } as unknown as jest.Mocked<XMLHttpRequest>;
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
      beforeSend: jest.fn(function (this: Request, cb) { cb(createXhr()); return this; }),
      success: jest.fn(function (this: Request, cb) {
        cb(createXhr({
          responseText: '{"status": "success", "time": "1", "id": null}',
          getResponseHeader: jest.fn().mockReturnValue('1'),
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

  it('runs success callback', () => {
    const socketId = 'socket-1';
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request.mockImplementation(() => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createXhr({
          responseText: '{"status": "success", "time": "2021-06-22 00:00:00", "id": null}',
          getResponseHeader: jest.fn().mockReturnValue(socketId)
        })
        cb(xhr)

        return this
      }),
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()

    expect(socket.id).toEqual(socketId)
    expect(pollSpy).toHaveBeenCalledTimes(1)
  })

  it('exits when returns unexpected response', () => {
    request.mockImplementation(() => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createXhr({ responseText: '{}', getResponseHeader: jest.fn().mockReturnValue('') })
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
    const socketId = 'socket-1', mockSetRequestHeader = jest.fn();
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request.mockImplementation(() => createMockRequest({
      beforeSend: jest.fn(function (this: Request, cb) {
        (new LocalStorage('socket')).set('id', socketId);
        cb(createXhr({setRequestHeader: mockSetRequestHeader}));

        return this;
      }),
      success: jest.fn(function (this: Request, cb) {
        const xhr = createXhr({
          responseText: '{"status": "success", "time": "2021-06-22 00:00:00", "id": null}',
          getResponseHeader: jest.fn().mockReturnValue(socketId)
        })
        cb(xhr)

        return this
      }),
    }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()

    expect(mockSetRequestHeader).toHaveBeenCalledWith('X-Socket-ID', socketId);
  })
})

describe('poll', () => {
  it('skips if no channels', () => {
    const timeoutSpy = jest.spyOn(window, 'setTimeout')

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());

    request
      // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') })
          cb(xhr)

          return this
        }),
      }))
      // poll implementation
      .mockImplementationOnce(() : any => createMockRequest())

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()

    expect(timeoutSpy).toHaveBeenCalledTimes(1)
  })

  it('resubscribes on 404', () => {
    const mockSend = jest.fn()
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') })
          cb(xhr)

          return this
        }),
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        fail: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ status: 404, responseText: '{"message": "Not Found"}' })
          cb(xhr)

          return this
        }),
      }))
    // subscribe implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ getResponseHeader: jest.fn().mockReturnValue('3') })
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

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('POST', subscribeRoute)
    expect(socket.subscribed).toEqual({ channel1: { new_message: [cb] } })
  })

  it('poll fail callback does nothing if not http status code 404', () => {
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') })
          cb(xhr)

          return this
        })
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        fail: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ status: 400 })
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
  })

  it('always loops', () => {
    const mockSend = jest.fn()
    const timeoutSpy = jest.spyOn(window, 'setTimeout')

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());

    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') })
          cb(xhr)

          return this
        }),
      }))
      // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        always: jest.fn(function (this: Request, cb) {
          cb()

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

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledTimes(1)
  })

  it('fires events', async () => {
    WindowVisibility.setActive();
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
      // connect implementation
      .mockImplementationOnce((): any =>
        createMockRequest({
          success: jest.fn(function (this: Request, cb) {
            const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') });
            cb(xhr);

            return this;
          }),
        })
      )
      // poll implementation
      .mockImplementationOnce((): any =>
        createMockRequest({
          success: jest.fn(function (this: Request, cb) {
            const xhr = createXhr({
              responseText:
                '{"status": "success", "time": "2021-06-21 00:00:00", "events": [{"event": "new_message", "channel": {"name": "channel1"}}]}',
              getResponseHeader: jest.fn().mockReturnValue('2'),
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

    expect(cb).toHaveBeenCalled();
  });

  it('skips unknown events', () => {
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') })
          cb(xhr)

          return this
        })
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success", "time": "2021-06-21 00:00:00", "events": [{"event": "new_message", "channel": {"name": "channel1"}}]}' })
          cb(xhr)

          return this
        })
      }))

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })
    socket.connect()
  })

  it('skips unexpected responses', () => {
    WindowVisibility.setActive();
    const mockSend = jest.fn()
    requestGroup.mockImplementationOnce(() => createMockRequestGroup());
    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('1') })
          cb(xhr)

          return this
        })
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '"foo"', getResponseHeader: jest.fn().mockReturnValue('2') })
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
        const xhr = createXhr({ responseText: '{}', getResponseHeader: jest.fn().mockReturnValue('...') })
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
    expect(socket.requestQueue.length).toBe(1)
    expect(socket.subscribed).toEqual({ channel1: {} })
  })

  it('does not clear events if already subscribed', () => {
    const mockSend = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      success: jest.fn(function (this: Request, cb) {
        const xhr = createXhr({ responseText: '{}', getResponseHeader: jest.fn().mockReturnValue('...') })
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
    const sendBeacon = jest.fn().mockImplementation(() => true)
    Object.defineProperty(window.navigator, 'sendBeacon', {
      writable: true,
      value: sendBeacon
    })

    const route = '/unsubscribe'; const channel = 'channel1'

    const channels : any = {}
    channels[channel] = {}

    const socket = new Socket({ routes: { unsubscribe: route } })
    Object.defineProperty(socket, 'channels', { value: channels, writable: true })

    expect(socket.subscribed).toEqual(channels)
    socket.unsubscribe(channel)

    expect(sendBeacon).toHaveBeenCalled()
    expect(socket.subscribed).toEqual({})
  })

  it('send request fails', () => {
    const sendBeacon = jest.fn().mockImplementation(() => false)
    Object.defineProperty(window.navigator, 'sendBeacon', {
      writable: true,
      value: sendBeacon
    })

    const route = '/unsubscribe'; const channel = 'channel1'

    const channels : any = {}
    channels[channel] = {}

    const socket = new Socket({ routes: { unsubscribe: route } })
    Object.defineProperty(socket, 'channels', { value: channels, writable: true })

    expect(socket.subscribed).toEqual(channels)
    socket.unsubscribe(channel)

    expect(sendBeacon).toHaveBeenCalled()
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
    expect(socket.requestQueue.length).toBe(1)
  })

  it('sends request immediately', () => {
    const mockSend = jest.fn(), mockData = jest.fn()
    request.mockImplementation(() : any => createMockRequest({
      data: mockData,
      send: mockSend,
      success: jest.fn(function (this: Request, cb) {
        const xhr = createXhr({ getResponseHeader: jest.fn().mockReturnValue('1') })
        cb(xhr)

        return this;
      })
    }))

    const route = '/publish'
    const socket = new Socket({ routes: { publish: route } })
    socket.lastRequestTime = '123';
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

  it('stops polling in always callback after disconnect', () => {
    const mockSend = jest.fn()
    const timeoutSpy = jest.spyOn(window, 'setTimeout')

    const route = '/connect'
    const socket = new Socket({ routes: { connect: route } })

    requestGroup.mockImplementationOnce(() => createMockRequestGroup());

    request
    // connect implementation
      .mockImplementationOnce(() : any => createMockRequest({
        success: jest.fn(function (this: Request, cb) {
          const xhr = createXhr({ responseText: '{"status": "success"}', getResponseHeader: jest.fn().mockReturnValue('...') })
          cb(xhr)

          return this
        })
      }))
    // poll implementation
      .mockImplementationOnce(() : any => createMockRequest({
        always: jest.fn(function (this: Request, cb) {
          socket.disconnect()
          cb()

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

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledTimes(0)
  })
})
