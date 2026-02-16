import { RequestGroup } from '../request-group';
import { Request } from '../request';

let mockFetch: jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

describe('RequestGroup', () => {
  it('initializes with an array of requests', () => {
    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    expect(group).toBeInstanceOf(RequestGroup);
  });

  it('executes callback after all requests succeed', async () => {
    const headers = new Map();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
      headers
    });

    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    await new Promise<void>((resolve) => {
      group.then((responses) => {
        expect(responses).toHaveLength(2);
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        resolve();
      });
    });

    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('executes error callback if any request fails', async () => {
    const headers = new Map();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue(''),
      headers
    });

    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    await expect(
      new Promise((resolve, reject) => {
        group.then(resolve, reject);
      })
    ).rejects.toMatchObject({ status: 500 });

    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('executes default error callback if any request fails', async () => {
    const headers = new Map();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue(''),
      headers
    });

    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    group.then(() => {});

    // Wait for promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('sends all requests in the group', () => {
    const headers = new Map();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
      headers
    });

    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    group.then(() => {}, () => {});

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});