import { UniversalTime } from '../universal-time'

describe('universal time', () => {
  it('can get time undefined', () => {
    const time = new UniversalTime()

    expect(time.getTime()).toBe('')
  })

  it('can store time', () => {
    const time = new UniversalTime()
    time.setTime('2021-06-21')

    expect(time.getTime()).toBe('2021-06-21')
  })
})
