/**
 * Ensures all browser tabs and windows use the same time.
 *
 * Prevents one Window from being behind / ahead of another
 * and events being displayed multiple times.
 */
import { LocalStorage } from './local-storage'

export class UniversalTime {
  private storage : LocalStorage = new LocalStorage('universal_time')

  setTime (time : string) : void {
    this.storage.set('time', time)
  }

  getTime () : string {
    return this.storage.get().time || ''
  }
}
