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

        const func = this.#listeners[e]
        if (event.delay !== 0) {
          setTimeout(() => { func[0](event.payload, event) }, (event.delay * 1000))
        } else {
          func[0](event.payload, event)
        }
      }
    }
}

export default Channel
