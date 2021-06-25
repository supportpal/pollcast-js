import PollcastConnector from '../src/pollcast'
import { Connector } from '../src/broadcasting/connector'

describe('Pollcast', () => {
  it('to be instance of connector', () => {
    expect(PollcastConnector).toBe(Connector)
  })
})
