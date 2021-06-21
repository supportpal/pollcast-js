import { urlEncode } from '../util/helpers'

export class Request {
  private xhr: XMLHttpRequest

  constructor (method: string, url: string) {
    this.xhr = new window.XMLHttpRequest()
    this.xhr.open(method, url)

    this.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    this.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  }

  success (cb: Function): Request {
    const self = this
    this.xhr.addEventListener('load', function () {
      if (self.xhr.readyState > 3 && self.xhr.status === 200) {
        cb(self.xhr)
      }
    })

    return this
  }

  always (cb: Function): Request {
    const self = this
    this.xhr.addEventListener('loadend', function (e) {
      cb(self.xhr, e)
    })

    return this
  }

  setRequestHeader (name: string, value: string): Request {
    this.xhr.setRequestHeader(name, value)

    return this
  }

  send (data?: object): void {
    let encodedData
    if (typeof data !== 'undefined') {
      encodedData = urlEncode(data)
    }

    this.xhr.send(encodedData || null)
  }

  abort () : void {
    this.xhr.abort()
  }
}
