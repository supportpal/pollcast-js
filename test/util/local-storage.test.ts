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

  it('returns empty object on json parse error', () => {
    const key = 'foo'
    localStorage.setItem(key, '{foo,}')

    const storage = new LocalStorage(key)
    expect(storage.get()).toEqual({})
  })

  it('returns empty object on unexpected serialized json value', () => {
    const key = 'foo'
    localStorage.setItem(key, '"foo"')

    const storage = new LocalStorage(key)
    expect(storage.get()).toEqual({})
  })
})
