import { Socket } from '../../../http/socket'
import { PrivateChannel } from '../private-channel'

const mockSubscribe = jest.fn()
const mockEmit = jest.fn()
jest.mock('../../../http/socket', () => {
  return {
    Socket: jest.fn().mockImplementation(() => {
      return {
        subscribe: mockSubscribe,
        emit: mockEmit
      }
    })
  }
})

beforeEach(() => jest.clearAllMocks())

describe('private channel', () => {
  it('can whisper', () => {
    const mockSocket = new Socket({}, '')
    const channel = new PrivateChannel(mockSocket, 'foo', {})
    channel.whisper('typing', { text: 'ba' })

    expect(mockEmit).toBeCalledTimes(1)
    expect(mockEmit).toHaveBeenCalledWith('foo', 'client-typing', { text: 'ba' })
  })
})
