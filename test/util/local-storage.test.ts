import { LocalStorage } from '../../src/util/local-storage'

describe('local storage', () => {
  it('can get when no values are stored', () => {
    const localStorage = new LocalStorage('foo')
    expect(localStorage.get()).toEqual({})
  })

  it('store a value', () => {
    const localStorage = new LocalStorage('foo')
    localStorage.set('bar', 'bar')

    expect(localStorage.get().bar).toEqual('bar')
  })
})
