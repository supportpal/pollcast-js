import { Request } from './request';

export class RequestGroup {
  private requests: Request[];

  constructor(requests: Request[]) {
    this.requests = requests;
  }

  /**
   * Execute a callback after all requests have completed successfully.
   */
  then(callback: (responses: Response[]) => void, errorCallback: (error: Response) => void = () => {}): void {
    const promises = this.requests.map((request) => {
      return new Promise<Response>((resolve, reject) => {
        request
          .success((response: Response) => resolve(response))
          .fail((response: Response) => reject(response));
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