import { SessionStorage } from '../session-storage'

describe('session storage', () => {
  it('can get when no values are stored', () => {
    const sessionStorage = new SessionStorage('foo')
    expect(sessionStorage.get()).toEqual({})
  })

  it('store a value', () => {
    const sessionStorage = new SessionStorage('foo')
    sessionStorage.set('bar', 'bar')

    expect(sessionStorage.get().bar).toEqual('bar')
  })

  it('returns empty object on json parse error', () => {
    const key = 'foo'
    sessionStorage.setItem(key, '{foo,}')

    const storage = new SessionStorage(key)
    expect(storage.get()).toEqual({})
  })

  it('returns empty object on unexpected serialized json value', () => {
    const key = 'foo'
    sessionStorage.setItem(key, '"foo"')

    const storage = new SessionStorage(key)
    expect(storage.get()).toEqual({})
  })
})
