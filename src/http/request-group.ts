import { Request } from './request';

export class RequestGroup {
  private requests: Request[];

  constructor(requests: Request[]) {
    this.requests = requests;
  }

  /**
   * Execute a callback after all requests have completed successfully.
   */
  then(callback: (responses: XMLHttpRequest[]) => void, errorCallback: (error: XMLHttpRequest) => void = () => {}): void {
    const promises = this.requests.map((request) => {
      return new Promise<XMLHttpRequest>((resolve, reject) => {
        request
          .success((xhr: XMLHttpRequest) => resolve(xhr))
          .fail((xhr: XMLHttpRequest) => reject(xhr));
      });
    });

    Promise.all(promises)
      .then((responses) => callback(responses))
      .catch((error) => errorCallback(error));

    while (this.requests.length > 0) {
      const request = this.requests.shift();
      if (request) {
        request.send();
      }
    }
  }
}