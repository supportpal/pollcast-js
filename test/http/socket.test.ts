import { mocked } from 'ts-jest/utils'
import { Socket } from '../../src/http/socket'
import { Request } from '../../src/http/request'

jest.mock('../../src/http/request', () => {
  return {
    Request: jest.fn()
  }
})

describe('constructor', () => {
  it('initialises', () => {
    expect(new Socket({}, 'foo')).toBeInstanceOf(Socket)
  })
})

describe('connect', () => {
  const request = mocked(Request, true)

  const pollSpy = jest.spyOn(Socket.prototype as any, 'poll')
  pollSpy.mockImplementation(() => {})

  beforeEach(() => {
    request.mockClear()
    pollSpy.mockClear()
  })

  it('sends request', () => {
    const mockSend = jest.fn()
    request.mockImplementation(() : any => {
      return {
        success: jest.fn(function (this: Request, cb) {
          const xhr = { responseText: '{"status": "success", "time": "1", "id": 1}' }
          cb(xhr)

          return this
        }),
        send: mockSend
      }
    })

    const token = 'foo'; const route = '/connect'
    const socket = new Socket({ routes: { connect: route } }, token)
    socket.connect()

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockSend).toHaveBeenCalledWith({ _token: token })
  })

  it('runs success callback', () => {
    request.mockImplementation(() : any => {
      return {
        success: jest.fn(function (this: Request, cb) {
          const xhr = { responseText: '{"status": "success", "time": "2021-06-22 00:00:00", "id": 1}' }
          cb(xhr)

          return this
        }),
        send: jest.fn()
      }
    })

    const token = 'foo'; const route = '/connect'
    const socket = new Socket({ routes: { connect: route } }, token)
    socket.connect()

    expect(socket.id).toEqual(1)
    expect(pollSpy).toBeCalledTimes(1)
  })

  it('exits when returns unexpected response', () => {
    request.mockImplementation(() : any => {
      return {
        success: jest.fn(function (this: Request, cb) {
          const xhr = { responseText: '{}' }
          cb(xhr)

          return this
        }),
        send: jest.fn()
      }
    })

    const token = 'foo'; const route = '/connect'
    const socket = new Socket({ routes: { connect: route } }, token)
    socket.connect()

    expect(pollSpy).toBeCalledTimes(0)
    expect(socket.id).toEqual('')
  })
})

describe('subscribe', () => {
  const request = mocked(Request, true)

  beforeEach(() => request.mockClear())

  it('sends request', () => {
    const mockSend = jest.fn()
    request.mockImplementation(() : any => {
      return {
        success: jest.fn(function (this: Request, cb) {
          const xhr = { responseText: '{}' }
          cb(xhr)

          return this
        }),
        send: mockSend
      }
    })

    const token = 'foo'; const route = '/subscribe'; const channel = 'channel1'
    const socket = new Socket({ routes: { subscribe: route } }, token)
    socket.subscribe(channel)

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockSend).toHaveBeenCalledWith({ _token: token, channel_name: channel })
    expect(socket.subscribed).toEqual({ channel1: {} })
  })

  it('returns if already subscribed', () => {
    const channel = 'channel1'
    const socket = new Socket({ routes: { subscribe: '/subscribe' } }, 'foo')

    Object.defineProperty(socket, 'channels', {
      value: { channel1: {} },
      writable: true
    })

    socket.subscribe(channel)

    expect(request).toHaveBeenCalledTimes(0)
    expect(socket.subscribed).toEqual({ channel1: {} })
  })
})

describe('Unsubscribe', () => {
  const request = mocked(Request, true)

  beforeEach(() => request.mockClear())

  it('sends request', () => {
    const mockSend = jest.fn()
    request.mockImplementation(() : any => {
      return {
        success: jest.fn(function (this: Request, cb) {
          cb()

          return this
        }),
        send: mockSend
      }
    })

    const token = 'foo'; const route = '/unsubscribe'; const channel = 'channel1'

    const channels : any = {}
    channels[channel] = {}

    const socket = new Socket({ routes: { unsubscribe: route } }, token)
    Object.defineProperty(socket, 'channels', { value: channels, writable: true })

    expect(socket.subscribed).toEqual(channels)
    socket.unsubscribe(channel)

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockSend).toHaveBeenCalledWith({ _token: token, channel_name: channel })
    expect(socket.subscribed).toEqual({})
  })
})

describe('on', () => {
  it('returns when channel doesnt exist', () => {
    const socket = new Socket({}, 'foo')
    Object.defineProperty(socket, 'channels', { value: {}, writable: true })

    socket.on('channel1', 'new_message', () => {})

    expect(socket.subscribed).toEqual({})
  })

  it('registers listener', () => {
    const socket = new Socket({}, 'foo')
    Object.defineProperty(socket, 'channels', { value: { channel1: {} }, writable: true })

    socket.on('channel1', 'new_message', () => {})

    expect(socket.subscribed).toEqual({ channel1: { new_message: [expect.any(Function)] } })
  })
})

describe('off', () => {
  it('returns if channel doesnt exist', () => {
    const socket = new Socket({}, 'foo')
    Object.defineProperty(socket, 'channels', { value: {}, writable: true })

    socket.off('channel1', 'new_message')

    expect(socket.subscribed).toEqual({})
  })

  it('returns if event doesnt exist', () => {
    const socket = new Socket({}, 'foo')
    Object.defineProperty(socket, 'channels', { value: { channel1: {} }, writable: true })

    socket.off('channel1', 'new_message')

    expect(socket.subscribed).toEqual({ channel1: {} })
  })

  it('removes all event listeners', () => {
    const socket = new Socket({}, 'foo')
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
    const socket = new Socket({}, 'foo')

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
  const request = mocked(Request, true)

  beforeEach(() => request.mockClear())

  it('sends request', () => {
    const mockSend = jest.fn()
    request.mockImplementation(() : any => {
      return { send: mockSend }
    })

    const token = 'foo'; const route = '/publish'
    const socket = new Socket({ routes: { publish: route } }, token)
    socket.emit('channel1', 'typing', {})

    expect(request).toHaveBeenCalledWith('POST', route)
    expect(mockSend).toHaveBeenCalledWith({ _token: token, channel_name: 'channel1', data: {}, event: 'typing' })
  })
})

describe('disconnect', () => {
  const request = mocked(Request, true)

  beforeEach(() => request.mockClear())

  it('aborts active request', () => {
    const abortMock = jest.fn()
    request.mockImplementation(() : any => {
      return { abort: abortMock }
    })

    const socket = new Socket({}, 'foo')
    Object.defineProperty(socket, 'request', {
      value: new Request('GET', '/'),
      writable: true
    })

    socket.disconnect()

    expect(abortMock).toHaveBeenCalled()
  })

  it('cancels timer', () => {
    jest.spyOn(window, 'clearTimeout')

    const socket = new Socket({}, 'foo')
    Object.defineProperty(socket, 'timer', {
      value: setTimeout(() => {}),
      writable: true
    })

    socket.disconnect()

    expect(clearTimeout).toHaveBeenCalledTimes(1)
  })
})
