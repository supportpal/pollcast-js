import { extend } from '../util/helpers'

class Channel {
    #options
    #events = {}
    #defaults = {
      channel: null
    }

    constructor (options) {
      this.#options = extend(this.#defaults, options)
    }

    on (event, callback) {
      if (this.#events[event] === undefined) {
        this.#events[event] = []
      }
      this.#events[event].push(callback)
      return this
    }

    fire (event) {
      for (const e in this.#events) {
        if (!Object.prototype.hasOwnProperty.call(this.#events, e) || e !== event.event) {
          continue
        }

        const func = this.#events[e]
        if (event.delay !== 0) {
          setTimeout(() => { func[0](event.payload, event) }, (event.delay * 1000))
        } else {
          func[0](event.payload, event)
        }
      }
    }
}

export default Channel
