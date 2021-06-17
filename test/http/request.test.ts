import {open, send, setRequestHeader, addEventListener, abort} from './__mocks__/xhr-mock'
import { Request } from '../../src/http/request'

describe('Request', () => {
  afterEach(() => jest.clearAllMocks())

  it('opens xhr and sets headers', () => {
    const request = new Request('GET', 'some/url')

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

  it('runs success callback', (done) => {
    const request = new Request('GET', 'some/url')
    request
      .success(function (xhr : any) {
        try {
          expect(xhr.status).toEqual(200)
          done()
        } catch (e) {
          done(e)
        }
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
