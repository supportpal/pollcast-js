import { Socket } from '../../../http/socket'
import { PresenceChannel } from '../presence-channel'

beforeEach(() => jest.clearAllMocks())

describe('presence channel', () => {
  it('registers here event listener', () => {
    const mockSocket = new Socket({}, '')
    mockSocket.subscribe = jest.fn()
    mockSocket.on = jest.fn()

    const channel = new PresenceChannel(mockSocket, 'foo', {})
    channel.here(() => {})

    expect(mockSocket.on).toBeCalledTimes(1)
    expect(mockSocket.on).toHaveBeenCalledWith('foo', 'pollcast:subscription_succeeded', expect.any(Function))
  })

  it('triggers here event callback', (done) => {
    const mockSocket = new Socket({}, '')
    mockSocket.subscribe = jest.fn()
    Object.defineProperty(mockSocket, 'channels', {
      value: { foo: {} },
      writable: true
    })

    const channel = new PresenceChannel(mockSocket, 'foo', {})
    channel.here((members: any) => {
      expect(members).toEqual([{ name: 'James' }])
      done()
    })

    mockSocket.dispatch('foo', 'pollcast:subscription_succeeded', [
      { user_id: 1, user_info: { name: 'James' } }
    ])
  })

  it('registers joining event listener', () => {
    const mockSocket = new Socket({}, '')
    mockSocket.subscribe = jest.fn()
    mockSocket.on = jest.fn()

    const channel = new PresenceChannel(mockSocket, 'foo', {})
    channel.joining(() => {})

    expect(mockSocket.on).toBeCalledTimes(1)
    expect(mockSocket.on).toHaveBeenCalledWith('foo', 'pollcast:member_added', expect.any(Function))
  })

  it('triggers joining event callback', (done) => {
    const mockSocket = new Socket({}, '')
    mockSocket.subscribe = jest.fn()
    Object.defineProperty(mockSocket, 'channels', {
      value: { foo: {} },
      writable: true
    })

    const channel = new PresenceChannel(mockSocket, 'foo', {})
    channel.joining((member: any) => {
      expect(member).toEqual({ name: 'James' })
      done()
    })

    mockSocket.dispatch('foo', 'pollcast:member_added', { user_id: 1, user_info: { name: 'James' } })
  })

  it('registers leaving event listener', () => {
    const mockSocket = new Socket({}, '')
    mockSocket.subscribe = jest.fn()
    mockSocket.on = jest.fn()

    const channel = new PresenceChannel(mockSocket, 'foo', {})
    channel.leaving(() => {})

    expect(mockSocket.on).toBeCalledTimes(1)
    expect(mockSocket.on).toHaveBeenCalledWith('foo', 'pollcast:member_removed', expect.any(Function))
  })

  it('triggers leaving event callback', (done) => {
    const mockSocket = new Socket({}, '')
    mockSocket.subscribe = jest.fn()
    Object.defineProperty(mockSocket, 'channels', {
      value: { foo: {} },
      writable: true
    })

    const channel = new PresenceChannel(mockSocket, 'foo', {})
    channel.leaving((member: any) => {
      expect(member).toEqual({ name: 'James' })
      done()
    })

    mockSocket.dispatch('foo', 'pollcast:member_removed', { user_id: 1, user_info: { name: 'James' } })
  })
})
