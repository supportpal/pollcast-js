import PollcastConnector from '../pollcast'
import { Connector } from '../broadcasting/connector'

describe('Pollcast', () => {
  it('to be instance of connector', () => {
    expect(PollcastConnector).toBe(Connector)
  })
})
