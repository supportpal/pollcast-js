import { RequestGroup } from '../request-group';
import { Request } from '../request';

let open: any,
  setRequestHeader: any,
  send: any,
  addEventListener: any,
  abort: any,
  xhr: any;

beforeEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();

  open = jest.fn();
  setRequestHeader = jest.fn();
  send = jest.fn();
  addEventListener = jest.fn();
  abort = jest.fn();
  xhr = {
    open,
    send,
    setRequestHeader,
    addEventListener,
    abort,
    withCredentials: false,
    readyState: 4,
    status: 200,
  };

  Object.defineProperty(window, 'XMLHttpRequest', {
    writable: true,
    value: jest.fn().mockImplementation(() => xhr),
  });
});

describe('RequestGroup', () => {
  it('initializes with an array of requests', () => {
    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    expect(group).toBeInstanceOf(RequestGroup);
  });

  it('executes callback after all requests succeed', (done) => {
    xhr.status = 200;

    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    group.then((responses) => {
      expect(responses).toHaveLength(2);
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      done();
    });

    addEventListener.mock.calls.forEach(([, callback]) => callback());
  });

  it('executes error callback if any request fails', (done) => {
    xhr.status = 500;

    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    group.then(
      () => {},
      (error) => {
        expect(error.status).toBe(500);
        done();
      }
    );

    addEventListener.mock.calls.forEach(([, callback]) => callback());
  });

  it('sends all requests in the group', () => {
    const requests = [new Request('GET', '/'), new Request('POST', '/submit')];
    const group = new RequestGroup(requests);

    group.then(() => {}, () => {});

    expect(send).toHaveBeenCalledTimes(2);
  });
});