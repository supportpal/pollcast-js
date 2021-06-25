import { uuid } from './helpers'
import { LocalStorage } from './local-storage'

/**
 * This class is static as we want it to act as a singleton.
 * No matter how many PollcastConnector instances you create the windowId should remain the same.
 */
class WindowVisibility {
  private static windowId = uuid()
  private static storage : LocalStorage = new LocalStorage('window-visibility')

  static setActive () {
    this.storage.set('lastActive', this.windowId)
  };

  static isActive () {
    return this.storage.get().lastActive === this.windowId
  };
}

WindowVisibility.setActive()
window.addEventListener('visibilitychange', function () {
  if (!document.hidden) {
    WindowVisibility.setActive()
  }
})

export default WindowVisibility
