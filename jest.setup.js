// Polyfill Response constructor if not available
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status !== undefined ? init.status : 200
      this.statusText = init.statusText || ''
      this.headers = init.headers || new Headers()
      this.ok = this.status >= 200 && this.status < 300
      this.url = ''
      this.redirected = false
      this.type = 'basic'
      this.bodyUsed = false
    }

    _getBodyAsString() {
      if (this.body === null || this.body === undefined) {
        return ''
      }
      return String(this.body)
    }

    async text() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'text' on 'Response': body stream already read")
      }
      this.bodyUsed = true
      return this._getBodyAsString()
    }

    async json() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'json' on 'Response': body stream already read")
      }
      this.bodyUsed = true
      const bodyStr = this._getBodyAsString()
      return JSON.parse(bodyStr || '{}')
    }

    clone() {
      if (this.bodyUsed) {
        throw new TypeError("Failed to execute 'clone' on 'Response': body stream already read")
      }
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      })
    }
  }
}




