import { Request, ResponseLike } from './request';

export class RequestGroup {
  private requests: Request[];

  constructor(requests: Request[]) {
    this.requests = requests;
  }

  /**
   * Execute a callback after all requests have completed successfully.
   */
  then(callback: (responses: ResponseLike[]) => void, errorCallback: (error: ResponseLike) => void = () => {}): void {
    const promises = this.requests.map((request) => {
      return new Promise<ResponseLike>((resolve, reject) => {
        request
          .success((response: ResponseLike) => resolve(response))
          .fail((response: ResponseLike) => reject(response));
      });
    });

    Promise.all(promises)
      .then((responses) => callback(responses))
      .catch((error) => errorCallback(error));

    while (this.requests.length > 0) {
      this.requests.shift()?.send();
    }
  }
}