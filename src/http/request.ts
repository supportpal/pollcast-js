import { urlEncodeObject } from '../util/helpers'

export class Request {
  private method: string
  private url: string
  private headers: { [key: string]: string | (() => string | null) } = {}
  private body: object = {}
  private withCredentials: boolean = false
  private keepalive: boolean = false
  private successCallbacks: ((response: Response) => void)[] = []
  private failCallbacks: ((response: Response) => void)[] = []
  private alwaysCallbacks: ((response: Response, e?: Event) => void)[] = []
  private abortController: AbortController = new AbortController()

  constructor (method: string, url: string) {
    this.method = method
    this.url = url

    this.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    this.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    this.fail(function (response: Response) {
      document.dispatchEvent(new CustomEvent('pollcast:request-error', { detail: response }))
    })
  }

  success (cb: (response: Response) => void): Request {
    this.successCallbacks.push(cb)
    return this
  }

  fail (cb: (response: Response) => void): Request {
    this.failCallbacks.push(cb)
    return this
  }

  always (cb: (response: Response, e?: Event) => void): Request {
    this.alwaysCallbacks.push(cb)
    return this
  }

  setWithCredentials (value: boolean): Request {
    this.withCredentials = value
    return this
  }

  setKeepAlive (value: boolean): Request {
    this.keepalive = value
    return this
  }

  setRequestHeader (name: string, value: string | (() => string | null)): Request {
    this.headers[name] = value
    return this
  }

  data (data: object): Request {
    this.body = data
    return this
  }

  send (): void {
    // Evaluate lazy headers at send-time
    const evaluatedHeaders: { [key: string]: string } = {}
    for (const [name, value] of Object.entries(this.headers)) {
      if (typeof value === 'function') {
        const evaluatedValue = value()
        if (evaluatedValue !== null) {
          evaluatedHeaders[name] = evaluatedValue
        }
      } else {
        evaluatedHeaders[name] = value
      }
    }

    const encodedBody = urlEncodeObject(this.body)

    fetch(this.url, {
      method: this.method,
      headers: evaluatedHeaders,
      body: encodedBody || undefined,
      credentials: this.withCredentials ? 'include' : 'same-origin',
      signal: this.abortController.signal,
      keepalive: this.keepalive
    })
      .then((fetchResponse) => {
        if (fetchResponse.ok) {
          this.successCallbacks.forEach((cb) => cb(fetchResponse))
        } else {
          this.failCallbacks.forEach((cb) => cb(fetchResponse))
        }

        this.alwaysCallbacks.forEach((cb) => cb(fetchResponse))
      })
      .catch((error) => {
        // Handle network errors or aborted requests
        if (error.name === 'AbortError') {
          // Request was aborted, don't trigger callbacks
          return
        }

        // Create error response using Response constructor
        const errorResponse = new Response(null, {
          status: 0,
          statusText: error.message || 'Network Error'
        })

        this.failCallbacks.forEach((cb) => cb(errorResponse))
        this.alwaysCallbacks.forEach((cb) => cb(errorResponse))
      })
  }

  abort (): void {
    this.abortController.abort()
  }
}
