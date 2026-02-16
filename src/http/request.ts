import { urlEncodeObject } from '../util/helpers'

// Response object that mimics XMLHttpRequest interface for backward compatibility
export interface ResponseLike {
  status: number
  responseText: string
  getResponseHeader(name: string): string | null
  setRequestHeader(name: string, value: string): void
  readyState: number
}

export class Request {
  private method: string
  private url: string
  private headers: { [key: string]: string } = {}
  private body: object = {}
  private withCredentials: boolean = false
  private successCallbacks: ((response: ResponseLike) => void)[] = []
  private failCallbacks: ((response: ResponseLike) => void)[] = []
  private alwaysCallbacks: ((response: ResponseLike, e?: Event) => void)[] = []
  private beforeSendCallbacks: ((response: ResponseLike) => void)[] = []
  private abortController: AbortController = new AbortController()
  private response: ResponseLike | null = null

  constructor (method: string, url: string) {
    this.method = method
    this.url = url

    this.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    this.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    this.fail(function (response: ResponseLike) {
      document.dispatchEvent(new CustomEvent('pollcast:request-error', { detail: response }))
    })
  }

  success (cb: (response: ResponseLike) => void): Request {
    this.successCallbacks.push(cb)
    return this
  }

  fail (cb: (response: ResponseLike) => void): Request {
    this.failCallbacks.push(cb)
    return this
  }

  always (cb: (response: ResponseLike, e?: Event) => void): Request {
    this.alwaysCallbacks.push(cb)
    return this
  }

  setWithCredentials (value: boolean): Request {
    this.withCredentials = value
    return this
  }

  setRequestHeader (name: string, value: string): Request {
    this.headers[name] = value
    return this
  }

  data (data: object): Request {
    this.body = data
    return this
  }

  beforeSend (cb: (response: ResponseLike) => void): Request {
    this.beforeSendCallbacks.push(cb)
    return this
  }

  send (): void {
    const responseHeaders: { [key: string]: string } = {}
    
    // Create a mock response object for beforeSend callbacks
    const mockResponse: ResponseLike = {
      status: 0,
      responseText: '',
      readyState: 1,
      getResponseHeader: (name: string) => responseHeaders[name.toLowerCase()] || null,
      setRequestHeader: (name: string, value: string) => {
        this.headers[name] = value
      }
    }

    this.beforeSendCallbacks.forEach((cb) => cb(mockResponse))

    const encodedBody = urlEncodeObject(this.body)

    fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: encodedBody || undefined,
      credentials: this.withCredentials ? 'include' : 'same-origin',
      signal: this.abortController.signal
    })
      .then(async (fetchResponse) => {
        const responseText = await fetchResponse.text()
        
        // Store response headers
        fetchResponse.headers.forEach((value, name) => {
          responseHeaders[name.toLowerCase()] = value
        })

        // Create XMLHttpRequest-like response object
        this.response = {
          status: fetchResponse.status,
          responseText: responseText,
          readyState: 4,
          getResponseHeader: (name: string) => responseHeaders[name.toLowerCase()] || null,
          setRequestHeader: () => {
            // No-op: headers cannot be modified after request completion
          }
        }

        if (fetchResponse.ok) {
          this.successCallbacks.forEach((cb) => cb(this.response))
        } else {
          this.failCallbacks.forEach((cb) => cb(this.response))
        }

        this.alwaysCallbacks.forEach((cb) => cb(this.response))
      })
      .catch((error) => {
        // Handle network errors or aborted requests
        if (error.name === 'AbortError') {
          // Request was aborted, don't trigger callbacks
          return
        }

        // Create error response
        const errorResponse: ResponseLike = {
          status: 0,
          responseText: '',
          readyState: 4,
          getResponseHeader: () => null,
          setRequestHeader: () => {
            // No-op: headers cannot be modified after request completion
          }
        }

        this.response = errorResponse
        this.failCallbacks.forEach((cb) => cb(errorResponse))
        this.alwaysCallbacks.forEach((cb) => cb(errorResponse))
      })
  }

  abort (): void {
    this.abortController.abort()
  }
}
