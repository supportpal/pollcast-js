import { Connector } from '../../src/broadcasting/connector'

const mockConnect = jest.fn()
const mockSubscribe = jest.fn()
const mockUnsubscribe = jest.fn()
const mockDisconnect = jest.fn()
jest.mock('../../src/http/socket', () => {
  return {
    Socket: jest.fn().mockImplementation(() => {
      return {
        connect: mockConnect,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        disconnect: mockDisconnect
      }
    })
  }
})

beforeEach(() => jest.clearAllMocks())

describe('connector', () => {
  it('can construct', () => {
    const connector = new Connector({})
    expect(connector).toBeInstanceOf(Connector)
  })

  it('merges default options', () => {
    const connector = new Connector({ polling: 10000 })
    expect(connector.options.polling).toEqual(10000)
  })

  it('constructor calls connect', () => {
    const connector = new Connector({})
    expect(connector).toBeInstanceOf(Connector)
    expect(mockConnect).toBeCalledTimes(1)
  })

  it('can join new channel', () => {
    const connector = new Connector({})
    connector.channel('foo')
    expect(mockSubscribe).toBeCalledTimes(1)
    expect(connector.channels).toMatchSnapshot()
  })

  it('doesnt join again if already in channel', () => {
    const connector = new Connector({})
    const channel1 = connector.channel('foo')
    const channel2 = connector.channel('foo')
    expect(channel1).toBe(channel2)
    expect(mockSubscribe).toBeCalledTimes(1)
  })

  it('can join private channel', () => {
    const connector = new Connector({})
    connector.privateChannel('foo')
    expect(mockSubscribe).toBeCalledTimes(1)
    expect(connector.channels).toMatchSnapshot()
  })

  it('doesnt join again if already in private channel', () => {
    const connector = new Connector({})
    const channel1 = connector.privateChannel('foo')
    const channel2 = connector.privateChannel('foo')
    expect(channel1).toBe(channel2)
    expect(mockSubscribe).toBeCalledTimes(1)
  })

  it('can join presence channel', () => {
    const connector = new Connector({})
    connector.presenceChannel('foo')
    expect(mockSubscribe).toBeCalledTimes(1)
    expect(connector.channels).toMatchSnapshot()
  })

  it('doesnt join again if already in presence channel', () => {
    const connector = new Connector({})
    const channel1 = connector.presenceChannel('foo')
    const channel2 = connector.presenceChannel('foo')
    expect(channel1).toBe(channel2)
    expect(mockSubscribe).toBeCalledTimes(1)
  })

  it('leaves all channels', () => {
    const connector = new Connector({})
    connector.presenceChannel('foo')
    connector.privateChannel('foo')
    connector.channel('foo')

    expect(Object.keys(connector.channels)).toHaveLength(3)

    connector.leave('foo')

    expect(mockUnsubscribe).toBeCalledTimes(3)
    expect(Object.keys(connector.channels)).toHaveLength(0)
  })

  it('leaves specified channel', () => {
    const connector = new Connector({})
    connector.channel('foo')

    expect(Object.keys(connector.channels)).toHaveLength(1)

    connector.leaveChannel('foo')

    expect(mockUnsubscribe).toBeCalledTimes(1)
    expect(Object.keys(connector.channels)).toHaveLength(0)
  })

  it('leave does nothing if specified channel doesnt exist', () => {
    const connector = new Connector({})

    connector.leaveChannel('foo')

    expect(mockUnsubscribe).toBeCalledTimes(0)
  })

  it('returns socket id', () => {
    const connector = new Connector({})
    expect(connector.socketId()).toEqual(undefined)
  })

  it('returns empty socket id when socket is not defined', () => {
    const connector = new Connector({})
    connector.socket = undefined
    expect(connector.socketId()).toEqual('')
  })

  it('can disconnect', () => {
    const connector = new Connector({})
    connector.disconnect()
    expect(mockDisconnect).toBeCalledTimes(1)
  })

  it('disconnect does nothing if socket is not set', () => {
    const connector = new Connector({})
    connector.socket = undefined
    connector.disconnect()
    expect(mockDisconnect).toBeCalledTimes(0)
  })
})
