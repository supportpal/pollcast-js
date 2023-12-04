import { Channel } from '../channel'
import { Socket } from '../../../http/socket'

const mockSubscribe = jest.fn()
const mockUnsubscribe = jest.fn()
const mockOn = jest.fn()
const mockOff = jest.fn()
jest.mock('../../../http/socket', () => {
  return {
    Socket: jest.fn().mockImplementation(() => {
      return {
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        on: mockOn,
        off: mockOff
      }
    })
  }
})

beforeEach(() => jest.clearAllMocks())

describe('public channel', () => {
  it('constructor calls subscribe', () => {
    const mockSocket = new Socket({}, '')
    const channel = new Channel(mockSocket, 'foo', {})

    expect(channel).toBeInstanceOf(Channel)
    expect(mockSubscribe).toBeCalledTimes(1)
    expect(mockSubscribe).toHaveBeenCalledWith('foo')
  })

  it('can unsubscribe from the channel', () => {
    const mockSocket = new Socket({}, '')
    const channel = new Channel(mockSocket, 'foo', {})
    channel.unsubscribe()

    expect(mockUnsubscribe).toBeCalledTimes(1)
    expect(mockUnsubscribe).toHaveBeenCalledWith('foo')
  })

  it('can listen for events on the channel', () => {
    const mockSocket = new Socket({}, '')
    const channel = new Channel(mockSocket, 'foo', {})
    const cb = () => {}
    channel.listen('new-messages', cb)

    expect(mockOn).toBeCalledTimes(1)
    expect(mockOn).toHaveBeenCalledWith('foo', 'new-messages', cb)
  })

  it('can stop listening for events', () => {
    const mockSocket = new Socket({}, '')
    const channel = new Channel(mockSocket, 'foo', {})
    const cb = () => {}
    channel.stopListening('new-messages', cb)

    expect(mockOff).toBeCalledTimes(1)
    expect(mockOff).toHaveBeenCalledWith('foo', 'new-messages', cb)
  })

  it('registers subscribed callback', () => {
    const mockSocket = new Socket({}, '')
    const channel = new Channel(mockSocket, 'foo', {})
    const cb = () => {}
    channel.subscribed(cb)

    expect(mockOn).toBeCalledTimes(1)
    expect(mockOn).toHaveBeenCalledWith('foo', 'pollcast:subscription_succeeded', cb)
  })

  it('error callback does nothing', () => {
    const mockSocket = new Socket({}, '')
    const channel = new Channel(mockSocket, 'foo', {})

    expect(channel.error(() => {})).toBe(channel)
  })
})
