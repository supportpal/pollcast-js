import { urlEncode } from '../../src/util/helpers'

describe('url encode', () => {
  it('string', () => {
    expect(urlEncode({ event: 'foo' })).toBe('event=foo')
  })

  it('object', () => {
    expect(urlEncode({
      channels: {
        channel1: ['event1', 'event2', 'event3']
      }
    })).toBe('channels%5Bchannel1%5D%5B0%5D=event1&channels%5Bchannel1%5D%5B1%5D=event2&channels%5Bchannel1%5D%5B2%5D=event3')
  })
})
