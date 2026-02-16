import { Request } from '../request'
import { toHaveBeenCalledExactlyOnceWith, toHaveBeenCalledBefore } from 'jest-extended';

expect.extend({ toHaveBeenCalledExactlyOnceWith, toHaveBeenCalledBefore });

let mockFetch: jest.Mock

beforeEach(() => {
  jest.resetAllMocks()
  jest.restoreAllMocks()

  // Mock fetch
  mockFetch = jest.fn()
  global.fetch = mockFetch
})

describe('failed requests', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue(''),
      headers: new Map()
    })
  })

  it('does not run success callback', async () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .success(cb)
      .send()

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(cb).toHaveBeenCalledTimes(0)
  })

  it('runs fail callback', async () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .fail(cb)
      .send()

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({
      status: 500
    }))
  })

  it('dispatches event on request failure', async () => {
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      document.addEventListener('pollcast:request-error', (e) => {
        resolve(e as CustomEvent);
      });
    });

    const request = new Request('GET', 'some/url');
    request.send();

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    const event = await eventPromise;
    expect(event.detail).toMatchObject({ status: 500 });
  });
})

describe('successful requests', () => {
  beforeEach(() => {
    const headers = new Map()
    headers.set('content-type', 'application/json')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('{"data": "test"}'),
      headers
    })
  })

  it('opens xhr and sets headers', () => {
    new Request('GET', 'some/url')

    // With fetch, we don't open immediately, but we should set headers in constructor
    const request = new Request('GET', 'some/url')
    request.send()

    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }))
  })

  it('registers success callback', async () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request.success(cb).send()

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('registers always callback', async () => {
    const request = new Request('GET', 'some/url');
    const alwaysCallback = jest.fn();

    request.always(alwaysCallback).send();

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(alwaysCallback).toHaveBeenCalledTimes(1);
  });

  it('sets header', () => {
    const request = new Request('GET', 'some/url')
    request.setRequestHeader('Foo', 'Bar')
    request.send()

    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      headers: expect.objectContaining({
        'Foo': 'Bar'
      })
    }))
  })

  it('sends request without data', () => {
    const request = new Request('GET', 'some/url')
    request.send()

    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      body: undefined
    }))
  })

  it('sends request with data', () => {
    const request = new Request('GET', 'some/url')
    request.data({ foo: 'bar' }).send()

    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      body: 'foo=bar'
    }))
  })

  it('runs success callback', async () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .success(cb)
      .send()

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({
      status: 200,
      responseText: '{"data": "test"}'
    }))
  })

  it('runs always callback', async () => {
    const request = new Request('GET', 'some/url');
    const alwaysCallback = jest.fn();

    request.always(alwaysCallback).send();

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(alwaysCallback).toHaveBeenCalledTimes(1);
  });

  it('can abort request', () => {
    const request = new Request('GET', 'some/url')
    request.send()
    request.abort()

    // Verify that the request was initiated with an AbortController
    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      signal: expect.any(AbortSignal)
    }))
  })

  it('fail callback does not run on status 200', async () => {
    const cb = jest.fn()
    const request = new Request('GET', 'some/url')
    request
      .fail(cb)
      .send()

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(cb).toHaveBeenCalledTimes(0)
  })
})

describe('the setWithCredentials method in the Request class', () => {
  let req: Request

  beforeEach(() => {
    const headers = new Map()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
      headers
    })
    req = new Request('GET', '/')
  })

  test('sets withCredentials to the correct value when setWithCredentials is called with true', () => {
    req.setWithCredentials(true)
    req.send()
    expect(mockFetch).toHaveBeenCalledWith('/', expect.objectContaining({
      credentials: 'include'
    }))
  })

  test('sets withCredentials to the correct value when setWithCredentials is called with false', () => {
    req.setWithCredentials(false)
    req.send()
    expect(mockFetch).toHaveBeenCalledWith('/', expect.objectContaining({
      credentials: 'same-origin'
    }))
  })

  test('returns the Request instance for method chaining', () => {
    const returnedReq = req.setWithCredentials(true)

    expect(returnedReq).toBeInstanceOf(Request)
  })
})
