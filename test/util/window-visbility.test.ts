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

  it('updates state on visibility change', () => {
    const localStorage = new LocalStorage('window-visibility')
    localStorage.set('lastActive', 'foo')

    expect(WindowVisibility.isActive()).toBeFalsy()

    // Change visibility
    Object.defineProperty(document, 'hidden', { value: false })
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))

    expect(WindowVisibility.isActive()).toBeTruthy()
  })
})
