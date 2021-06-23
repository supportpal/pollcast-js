import { WindowVisibility } from '../../src/util/window-visibility'
import { LocalStorage } from '../../src/util/local-storage'

describe('window visibility', () => {
  let window : WindowVisibility

  beforeEach(() => {
    window = new WindowVisibility()
  })

  it('defaults to active', () => {
    expect(window.isActive()).toBeTruthy()
  })

  it('sets current window as active', () => {
    window.setActive()
    expect(window.isActive()).toBeTruthy()
  })

  it('updates state on visibility change', () => {
    const localStorage = new LocalStorage('window-visibility')
    localStorage.set('lastActive', 'foo')

    expect(window.isActive()).toBeFalsy()

    // Change visibility
    Object.defineProperty(document, 'hidden', { value: false })
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))

    expect(window.isActive()).toBeTruthy()
  })
})
