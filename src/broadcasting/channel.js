import { extend } from '../util/helpers'

class Channel {
    #options
    #listeners = {}
    #defaults = {
      channel: null
    }

    constructor (options) {
      this.#options = extend(this.#defaults, options)
    }

    get listeners() {
        return this.#listeners
    }

    on (event, callback) {
      if (typeof this.#listeners[event] === 'undefined') {
        this.#listeners[event] = []
      }

      this.#listeners[event].push(callback)

      return this
    }

    fire (event) {
      for (const e in this.#listeners) {
        if (!Object.prototype.hasOwnProperty.call(this.#listeners, e) || e !== event.event) {
          continue
        }

        this.#listeners[e][0](event.payload, event)
      }
    }
}

export default Channel
