import WindowVisibility from '../../src/util/window-visibility'
import { LocalStorage } from '../../src/util/local-storage'

describe('window visibility', () => {
  it('defaults to active', () => {
    expect(WindowVisibility.isActive()).toBeTruthy()
  })

  it('sets current window as active', () => {
    WindowVisibility.setActive()
    expect(WindowVisibility.isActive()).toBeTruthy()
  })

  it('updates state on document visible event', () => {
    const localStorage = new LocalStorage('window-visibility')
    localStorage.set('lastActive', 'foo')

    expect(WindowVisibility.isActive()).toBeFalsy()

    // Change visibility
    Object.defineProperty(document, 'hidden', { writable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))

    expect(WindowVisibility.isActive()).toBeTruthy()
  })

  it('updates state on document hidden event', () => {
    const localStorage = new LocalStorage('window-visibility')
    localStorage.set('lastActive', 'foo')

    expect(WindowVisibility.isActive()).toBeFalsy()

    // Change visibility
    Object.defineProperty(document, 'hidden', { writable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))

    expect(WindowVisibility.isActive()).toBeFalsy()
  })
})
