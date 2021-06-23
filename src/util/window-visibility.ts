import { uuid } from './helpers'
import { LocalStorage } from './local-storage'

export class WindowVisibility {
  private windowId = uuid()
  private storage : LocalStorage = new LocalStorage('window-visibility')

  constructor () {
    this.setActive()

    const self = this
    window.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        self.setActive()
      }
    })
  }

  setActive () {
    this.storage.set('lastActive', this.windowId)
  };

  isActive () {
    return this.storage.get().lastActive === this.windowId
  };
}
