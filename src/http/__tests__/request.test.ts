import { Request } from '../request'
import { toHaveBeenCalledExactlyOnceWith, toHaveBeenCalledBefore } from 'jest-extended';

expect.extend({ toHaveBeenCalledExactlyOnceWith, toHaveBeenCalledBefore });

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
    open,
    send,
    setRequestHeader,
    addEventListener,
    abort,
    withCredentials: false,
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

    expect(addEventListener.mock.calls.length).toBe(2)
    addEventListener.mock.calls[1][1]()

    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('runs fail callback', () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .fail(cb)
      .send()

    expect(addEventListener.mock.calls.length).toBe(2)
    addEventListener.mock.calls[1][1]()

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(xhr)
  })

  it('dispatches event on request failure', async () => {
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      document.addEventListener('pollcast:request-error', (e) => {
        resolve(e as CustomEvent);
      });
    });

    const request = new Request('GET', 'some/url');
    request.send();

    expect(addEventListener.mock.calls.length).toBe(1);
    addEventListener.mock.calls[0][1]();

    const event = await eventPromise;
    expect(event.detail).toBe(xhr);
  });
})

describe('successful requests', () => {
  it('opens xhr and sets headers', () => {
    new Request('GET', 'some/url')

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

    expect(send).toHaveBeenCalledWith('')
  })

  it('sends request with data', () => {
    const request = new Request('GET', 'some/url')
    request.data({ foo: 'bar' }).send()

    expect(send).toHaveBeenCalledWith('foo=bar')
  })

  it('runs success callback', () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .success(cb)
      .send()

    expect(addEventListener.mock.calls.length).toBe(2)
    addEventListener.mock.calls[1][1]()

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(xhr)
  })

  it('runs always callback', async () => {
    const request = new Request('GET', 'some/url');
    const alwaysCallback = jest.fn();

    request.always(alwaysCallback).send();

    expect(addEventListener.mock.calls.length).toBe(2);
    addEventListener.mock.calls[1][1]();

    expect(alwaysCallback).toHaveBeenCalledTimes(1);
  });

  it('can abort request', () => {
    const request = new Request('GET', 'some/url')
    request.abort()

    expect(abort).toHaveBeenCalled()
  })

  it('fail callback does not run on status 200', () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .fail(cb)
      .send()

    const [[, load]] = addEventListener.mock.calls
    load()

    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('executes all beforeSend callbacks in order before sending the request', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const request = new Request('GET', '/some-url');
    request.beforeSend(callback1).beforeSend(callback2).send();

    expect(callback1).toHaveBeenCalledExactlyOnceWith(xhr);
    expect(callback2).toHaveBeenCalledExactlyOnceWith(xhr);
    expect(callback1).toHaveBeenCalledBefore(callback2);
    expect(send).toHaveBeenCalledTimes(1);
  });
})

describe('the setWithCredentials method in the Request class', () => {
  let req: Request

  beforeEach(() => {
    req = new Request('GET', '/')
  })

  test('sets withCredentials to the correct value when setWithCredentials is called with true', () => {
    req.setWithCredentials(true)
    expect(xhr.withCredentials).toBe(true)
  })

  test('sets withCredentials to the correct value when setWithCredentials is called with false', () => {
    req.setWithCredentials(false)
    expect(xhr.withCredentials).toBe(false)
  })

  test('returns the Request instance for method chaining', () => {
    const returnedReq = req.setWithCredentials(true)

    expect(returnedReq).toBeInstanceOf(Request)
  })
})
