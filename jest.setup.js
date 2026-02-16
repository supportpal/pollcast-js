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
    }

    async text() {
      if (this.body === null || this.body === undefined) {
        return ''
      }
      return String(this.body)
    }

    async json() {
      const text = await this.text()
      return JSON.parse(text || '{}')
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      })
    }
  }
}




