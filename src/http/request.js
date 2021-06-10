import { serialize } from '../util/helpers'

class Request {
    #xhr

    constructor (method, url) {
      this.#xhr = new XMLHttpRequest()
      this.#xhr.open(method, url)

      this.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
      this.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    }

    success (cb) {
      const self = this
      this.#xhr.addEventListener('load', function () {
        if (self.#xhr.readyState > 3 && self.status === 200) {
          cb(self.#xhr)
        }
      })

      return this
    }

    setRequestHeader (name, value) {
      this.#xhr.setRequestHeader(name, value)

      return this
    }

    send (data) {
      if (typeof data !== 'undefined') {
        data = serialize(data)
      }

      this.#xhr.send(data || null)
    }
}

export default Request
