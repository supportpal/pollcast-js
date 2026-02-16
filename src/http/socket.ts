import { Request } from './request'
import WindowVisibility from '../util/window-visibility'
import { isEmptyObject } from '../util/helpers'
import {LocalStorage} from "../util/local-storage";
import {RequestGroup} from "./request-group";

export class Socket {
  /**
   * Socket ID.
   */
  id: string = ''

  /**
   * Socket options.
   */
  private options: any

  /**
   * Poll for data which has been created since this timestamp.
   */
  private lastRequestTime: string = ''

  /**
   * Function used to short poll every so many milliseconds.
   */
  private timer: ReturnType<typeof setTimeout> | undefined

  /**
   * The current XHR request.
   */
  private request: Request | undefined

  /**
   * Request queue to prevent XHR requests before successfully connected to the server.
   */
  private requestQueue: Request[] = [];

  /**
   * Subscribed channels.
   */
  private channels: { [name: string]: { [event: string]: ((data: any) => void)[] } } = {}

  private storage : LocalStorage = new LocalStorage('socket')

  constructor (options: any) {
    this.options = options
  }

  /**
   * Connect to the server, start xhr-polling.
   */
  connect (): void {
    const self = this
    this.request = this.createRequest('POST', this.options.routes.connect)
    this.request
      .success(function (xhr: XMLHttpRequest) {
        const response = JSON.parse(xhr.responseText)
        if (response.status !== 'success') {
          return
        }

        self.lastRequestTime = response.time

        const group = new RequestGroup(self.requestQueue);
        group.then(() => self.poll());
      })
      .send()
  }

  get subscribed () {
    return this.channels
  }

  /**
   * Join a channel.
   */
  subscribe (channel: string): void {
    if (!Object.hasOwnProperty.call(this.channels, channel)) {
      this.channels[channel] = {};
    }

    const request = this.createRequest('POST', this.options.routes.subscribe);
    for (const name in this.options?.auth?.headers) {
      request.setRequestHeader(name, this.options.auth.headers[name]);
    }

    request.data({
      channel_name: channel,
    })

    if (this.lastRequestTime !== '') {
      request.send();
    } else {
      this.requestQueue.push(request);
    }
  }

  /**
   * Leave a channel.
   */
  unsubscribe (channel: string): void {
    const data = {
      channel_name: channel,
    }

    fetch(this.options.routes.unsubscribe, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(data),
      keepalive: true,
    }).then(() => {
      delete this.channels[channel]
    }).catch(() => {
      // Silently ignore errors, similar to sendBeacon behavior
    })
  }

  /**
   * Listen for an event on the channel.
   */
  on (channel: string, event: string, callback: (data: any) => void): void {
    if (!Object.hasOwnProperty.call(this.channels, channel)) {
      return
    }

    if (!Object.hasOwnProperty.call(this.channels[channel], event)) {
      this.channels[channel][event] = []
    }

    this.channels[channel][event].push(callback)
  }

  /**
   * Stop listening for a given event on the channel.
   */
  off (channel: string, event: string, callback?: (data: any) => void): void {
    if (!Object.hasOwnProperty.call(this.channels, channel) ||
            !Object.hasOwnProperty.call(this.channels[channel], event)
    ) {
      return
    }

    if (callback) {
      this.channels[channel][event] = this.channels[channel][event].filter((cb: (data: any) => void) => cb !== callback)
    } else {
      delete this.channels[channel][event]
    }
  }

  /**
   * Publish a message from the client to the server.
   */
  emit (channel: string, event: string, data: any): void {
    const request = this.createRequest('POST', this.options.routes.publish)
    request
      .data({
        channel_name: channel,
        event,
        data,
      })

    if (this.lastRequestTime !== '') {
      request.send();
    } else {
      this.requestQueue.push(request);
    }
  }

  /**
   * Disconnect the client from the server.
   */
  disconnect (): void {
    this.id = '';
    this.lastRequestTime = '';
    this.requestQueue = [];
    if (this.request) {
      this.request.abort()
    }

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  dispatch (channel: string, event: string, data: any) {
    if (!Object.hasOwnProperty.call(this.channels, channel) ||
        !Object.hasOwnProperty.call(this.channels[channel], event)
    ) {
      return
    }

    const events = this.channels[channel][event]
    for (let i = 0; i < events.length; i++) {
      events[i](data)
    }
  }

  private createRequest (method: string, url: string): Request {
    const self = this;
    const request = new Request(method, url)

    request.setWithCredentials(this.options.withCredentials || false)

    request.beforeSend(function (xhr: XMLHttpRequest) {
      if (self.storage.get().id) {
        xhr.setRequestHeader('X-Socket-ID', self.storage.get().id)
      }
    })

    request.success(function (xhr: XMLHttpRequest) {
      const id = xhr.getResponseHeader('X-Socket-ID');
      if (id) {
        self.storage.set('id', self.id = id);
      }
    });

    return request
  }

  private poll (): void {
    const self = this

    const channels : any = {}
    for (const channel in this.channels) {
      channels[channel] = Object.keys(this.channels[channel])
    }

    if (!WindowVisibility.isActive() || isEmptyObject(channels)) {
      /* istanbul ignore else */
      if (this.id !== '') {
        /* istanbul ignore next */
        self.timer = setTimeout(() => self.poll(), this.options.polling)
      }
      return
    }

    this.request = this.createRequest('POST', this.options.routes.receive)
    this.request
      .success((xhr: XMLHttpRequest) => self.fireEvents(xhr.responseText))
      .fail((xhr: XMLHttpRequest) => {
        // Reconnect on expired token.
        if (xhr.status === 401) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.data?.code === 'TOKEN_EXPIRED') {
              // Save channels before disconnecting
              const channelsToResubscribe = Object.keys(this.channels);
              self.disconnect();
              self.connect();
              for (const _channel of channelsToResubscribe) {
                self.subscribe(_channel);
              }
            }
          } catch (_e) {
            // If we can't parse the response, ignore the error
          }
        }
        // https://github.com/supportpal/pollcast/issues/7
        if (xhr.status === 404) {
          for (const channel in this.channels) {
            self.subscribe(channel)
          }
        }
      })
      .always(() => {
        // only if the socket is active
        if (this.id !== '') {
          /* istanbul ignore next */
          self.timer = setTimeout(() => self.poll(), self.options.polling)
        }
      })
      .data({
        time: this.lastRequestTime,
        channels,
      })
      .send()
  }

  private fireEvents (response: any): void {
    response = JSON.parse(response)
    if (response.status !== 'success') {
      return
    }

    this.lastRequestTime = response.time

    Object.keys(response.events).forEach((event) => {
      const item = response.events[event]
      this.dispatch(item.channel.name, item.event, item.payload)
    })
  }
}
