import { Request } from '../request'
import { toHaveBeenCalledExactlyOnceWith, toHaveBeenCalledBefore } from 'jest-extended';

expect.extend({ toHaveBeenCalledExactlyOnceWith, toHaveBeenCalledBefore });

let mockFetch: jest.Mock

// Helper to create a mock Response with clone support
const createMockResponse = (config: any) => {
  const response = {
    ok: config.ok !== undefined ? config.ok : true,
    status: config.status || 200,
    text: jest.fn().mockResolvedValue(config.text || ''),
    json: jest.fn().mockResolvedValue(config.json || {}),
    headers: config.headers || new Map(),
    clone: jest.fn()
  }
  // Make clone return a new instance with the same properties
  response.clone.mockImplementation(() => createMockResponse(config))
  return response
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.restoreAllMocks()

  // Mock fetch
  mockFetch = jest.fn()
  global.fetch = mockFetch
})

describe('failed requests', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue(createMockResponse({
      ok: false,
      status: 500,
      text: ''
    }))
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
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      status: 200,
      text: '{"data": "test"}',
      headers
    }))
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

  it('evaluates lazy header function and includes header when function returns string', () => {
    const request = new Request('GET', 'some/url')
    const headerFunc = jest.fn().mockReturnValue('token-123')
    request.setRequestHeader('Authorization', headerFunc)
    request.send()

    expect(headerFunc).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'token-123'
      })
    }))
  })

  it('evaluates lazy header function and excludes header when function returns null', () => {
    const request = new Request('GET', 'some/url')
    const headerFunc = jest.fn().mockReturnValue(null)
    request.setRequestHeader('Authorization', headerFunc)
    request.send()

    expect(headerFunc).toHaveBeenCalledTimes(1)
    const fetchCall = mockFetch.mock.calls[0][1]
    expect(fetchCall.headers).not.toHaveProperty('Authorization')
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
      status: 200
    }))

    // Verify we can get the response text
    const response = cb.mock.calls[0][0]
    const text = await response.text()
    expect(text).toBe('{"data": "test"}')
  })

  it('runs always callback', async () => {
    const request = new Request('GET', 'some/url');
    const alwaysCallback = jest.fn();

    request.always(alwaysCallback).send();

    // Wait for fetch promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(alwaysCallback).toHaveBeenCalledTimes(1);
  });

  it('can abort request', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const request = new Request('GET', 'some/url')
    request.send()
    request.abort()

    // Wait for the aborted fetch to reject
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that the request was initiated with an AbortController
    expect(mockFetch).toHaveBeenCalledWith('some/url', expect.objectContaining({
      signal: expect.any(AbortSignal)
    }))

    consoleErrorSpy.mockRestore()
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
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      status: 200,
      text: '',
      headers
    }))
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

describe('the setKeepAlive method in the Request class', () => {
  let req: Request

  beforeEach(() => {
    const headers = new Map()
    mockFetch.mockResolvedValue(createMockResponse({
      ok: true,
      status: 200,
      text: '',
      headers
    }))
    req = new Request('GET', '/')
  })

  test('sets keepalive to true when setKeepAlive is called with true', () => {
    req.setKeepAlive(true)
    req.send()
    expect(mockFetch).toHaveBeenCalledWith('/', expect.objectContaining({
      keepalive: true
    }))
  })

  test('sets keepalive to false when setKeepAlive is called with false', () => {
    req.setKeepAlive(false)
    req.send()
    expect(mockFetch).toHaveBeenCalledWith('/', expect.objectContaining({
      keepalive: false
    }))
  })

  test('keepalive defaults to false when setKeepAlive is not called', () => {
    req.send()
    expect(mockFetch).toHaveBeenCalledWith('/', expect.objectContaining({
      keepalive: false
    }))
  })

  test('returns the Request instance for method chaining', () => {
    const returnedReq = req.setKeepAlive(true)

    expect(returnedReq).toBeInstanceOf(Request)
  })

  test('can be chained with other methods', () => {
    req
      .setKeepAlive(true)
      .setWithCredentials(true)
      .data({ test: 'value' })
      .send()

    expect(mockFetch).toHaveBeenCalledWith('/', expect.objectContaining({
      keepalive: true,
      credentials: 'include',
      body: 'test=value'
    }))
  })
})

describe('network errors', () => {
  beforeEach(() => {
    // Reset mockFetch to not have any default implementation
    mockFetch.mockReset()
  })

  it('logs error and triggers only always callback on network error', async () => {
    const failCallback = jest.fn()
    const alwaysCallback = jest.fn()
    const successCallback = jest.fn()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Mock a network error
    mockFetch.mockRejectedValue(new Error('Network Error'))

    const request = new Request('GET', 'some/url')
    request
      .success(successCallback)
      .fail(failCallback)
      .always(alwaysCallback)
      .send()

    // Wait for fetch promise to reject
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(successCallback).not.toHaveBeenCalled()
    expect(failCallback).not.toHaveBeenCalled()
    expect(alwaysCallback).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Pollcast request error.', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it('logs error and triggers always callback on network error without message', async () => {
    const alwaysCallback = jest.fn()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Mock a network error without message
    const error = new Error()
    error.message = ''
    mockFetch.mockRejectedValue(error)

    const request = new Request('GET', 'some/url')
    request.always(alwaysCallback).send()

    // Wait for fetch promise to reject
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(alwaysCallback).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Pollcast request error.', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })
})

describe('aborted requests', () => {
  beforeEach(() => {
    // Reset mockFetch to not have any default implementation
    mockFetch.mockReset()
  })

  it('triggers only always callback when request is aborted', async () => {
    const successCallback = jest.fn()
    const failCallback = jest.fn()
    const alwaysCallback = jest.fn()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Mock an abort error
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockFetch.mockRejectedValue(abortError)

    const request = new Request('GET', 'some/url')
    request
      .success(successCallback)
      .fail(failCallback)
      .always(alwaysCallback)
      .send()

    // Wait for fetch promise to reject
    await new Promise(resolve => setTimeout(resolve, 10))

    // Success and fail callbacks should not be triggered for aborted requests
    expect(successCallback).not.toHaveBeenCalled()
    expect(failCallback).not.toHaveBeenCalled()
    // Always callback should still be triggered
    expect(alwaysCallback).toHaveBeenCalledTimes(1)
    // AbortErrors are still logged since they go through the generic error handler
    expect(consoleErrorSpy).toHaveBeenCalledWith('Pollcast request error.', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it('does not dispatch event when request is aborted', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    let eventDispatched = false
    const handler = () => {
      eventDispatched = true
    }
    document.addEventListener('pollcast:request-error', handler)

    // Mock an abort error
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    mockFetch.mockRejectedValue(abortError)

    const request = new Request('GET', 'some/url')
    request.send()

    // Wait for fetch promise to reject
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(eventDispatched).toBe(false)

    document.removeEventListener('pollcast:request-error', handler)
    consoleErrorSpy.mockRestore()
  })
})

