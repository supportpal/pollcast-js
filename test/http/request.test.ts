import { Request } from '../../src/http/request'

let open :any,
  setRequestHeader : any,
  send : any,
  addEventListener : any,
  abort : any,
  xhr : any

beforeEach(() => {
  jest.resetAllMocks()
  jest.restoreAllMocks()

  open = jest.fn()
  setRequestHeader = jest.fn()
  send = jest.fn()
  addEventListener = jest.fn()
  abort = jest.fn()
  xhr = {
    open: open,
    send: send,
    setRequestHeader: setRequestHeader,
    addEventListener: addEventListener,
    abort: abort,
    readyState: 4,
    status: 200
  }

  Object.defineProperty(window, 'XMLHttpRequest', {
    writable: true,
    value: jest.fn().mockImplementation(() => (xhr))
  })
})

describe('failed requests', () => {
  beforeEach(() => {
    xhr.status = 500
  })

  it('does not run success callback', () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .success(cb)
      .send()

    const [[, load]] = addEventListener.mock.calls
    load()

    expect(cb).toBeCalledTimes(0)
  })
})

describe('successful requests', () => {
  it('opens xhr and sets headers', () => {
    /* eslint-disable no-new */
    new Request('GET', 'some/url')
    /* eslint-enable no-new */

    expect(open).toHaveBeenCalledWith('GET', 'some/url')
    expect(setRequestHeader.mock.calls.length).toBe(2)
    expect(setRequestHeader.mock.calls[0]).toEqual(['X-Requested-With', 'XMLHttpRequest'])
    expect(setRequestHeader.mock.calls[1]).toEqual(['Content-Type', 'application/x-www-form-urlencoded'])
  })

  it('registers success callback', () => {
    const request = new Request('GET', 'some/url')
    request.success(() => 1)

    expect(addEventListener).toHaveBeenCalledWith('load', expect.any(Function))
  })

  it('registers always callback', () => {
    const request = new Request('GET', 'some/url')
    request.always(() => 1)

    expect(addEventListener).toHaveBeenCalledWith('loadend', expect.any(Function))
  })

  it('sets header', () => {
    const request = new Request('GET', 'some/url')
    request.setRequestHeader('Foo', 'Bar')

    expect(setRequestHeader).toHaveBeenCalledWith('Foo', 'Bar')
  })

  it('sends request without data', () => {
    const request = new Request('GET', 'some/url')
    request.send()

    expect(send).toHaveBeenCalledWith(null)
  })

  it('sends request with data', () => {
    const request = new Request('GET', 'some/url')
    request.send({ foo: 'bar' })

    expect(send).toHaveBeenCalledWith('foo=bar')
  })

  it('runs success callback', () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .success(cb)
      .send()

    const [[, load]] = addEventListener.mock.calls
    load()

    expect(cb).toBeCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(xhr)
  })

  it('runs always callback', (done) => {
    const request = new Request('GET', 'some/url')
    request
      .always(function () {
        done()
      })
      .send()

    const [[, load]] = addEventListener.mock.calls
    load()
  })

  it('can abort request', () => {
    const request = new Request('GET', 'some/url')
    request.abort()

    expect(abort).toHaveBeenCalled()
  })
})