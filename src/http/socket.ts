import { Request } from './request'
import { UniversalTime } from '../util/universal-time'
import WindowVisibility from '../util/window-visibility'
import { isEmptyObject } from '../util/helpers'

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
  private universalTime: UniversalTime = new UniversalTime()

  /**
   * Function used to short poll every so many milliseconds.
   */
  private timer: ReturnType<typeof setTimeout> | undefined

  /**
   * The current XHR request.
   */
  private request: Request | undefined;

  /**
   * Subscribed channels.
   */
  private channels: { [name: string]: { [event: string]: Function[] } } = {}

  constructor (options: any, csrfToken: string | null) {
    this.options = options
    this.options.csrfToken = csrfToken
  }

  /**
   * Connect to the server, start xhr-polling.
   */
  connect (): void {
    const self = this
    this.request = new Request('POST', this.options.routes.connect)
    this.request
      .success(function (xhr: XMLHttpRequest) {
        const response = JSON.parse(xhr.responseText)
        if (response.status !== 'success') {
          return
        }

        self.universalTime.setTime(response.time)
        self.id = response.id
        self.poll()
      })
      .send({ _token: this.options.csrfToken })
  }

  get subscribed () {
    return this.channels
  }

  /**
   * Join a channel.
   */
  subscribe (channel: string): void {
    if (Object.hasOwnProperty.call(this.channels, channel)) {
      return
    }

    this.channels[channel] = {}
    const request = new Request('POST', this.options.routes.subscribe)
    request
      .send({
        channel_name: channel,
        _token: this.options.csrfToken
      })
  }

  /**
   * Leave a channel.
   */
  unsubscribe (channel: string): void {
    const self = this
    const request = new Request('POST', this.options.routes.unsubscribe)
    request
      .success(() => delete self.channels[channel])
      .send({
        channel_name: channel,
        _token: this.options.csrfToken
      })
  }

  /**
   * Listen for an event on the channel.
   */
  on (channel: string, event: string, callback: Function): void {
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
  off (channel: string, event: string, callback?: Function): void {
    if (!Object.hasOwnProperty.call(this.channels, channel) ||
            !Object.hasOwnProperty.call(this.channels[channel], event)
    ) {
      return
    }

    if (callback) {
      this.channels[channel][event] = this.channels[channel][event].filter((cb: Function) => cb !== callback)
    } else {
      delete this.channels[channel][event]
    }
  }

  /**
   * Publish a message from the client to the server.
   */
  emit (channel: string, event: string, data: any): void {
    const request = new Request('POST', this.options.routes.publish)
    request
      .send({
        channel_name: channel,
        event: event,
        data: data,
        _token: this.options.csrfToken
      })
  }

  /**
   * Disconnect the client from the server.
   */
  disconnect (): void {
    if (this.request) {
      this.request.abort()
    }

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  dispatch(channel: string, event: string, data: any) {
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

  private poll (): void {
    const self = this

    const channels : any = {}
    for (const channel in this.channels) {
      channels[channel] = Object.keys(this.channels[channel])
    }

    if (!WindowVisibility.isActive() || isEmptyObject(channels)) {
      self.timer = setTimeout(() => self.poll(), this.options.polling)
      return
    }

    this.request = new Request('POST', this.options.routes.receive)
    this.request
      .success((xhr: XMLHttpRequest) => self.fireEvents(xhr.responseText))
      .always(() => {
        self.timer = setTimeout(() => self.poll(), self.options.polling)
      })
      .send({
        time: this.universalTime.getTime(),
        channels: channels,
        _token: this.options.csrfToken
      })
  }

  private fireEvents (response: any): void {
    response = JSON.parse(response)
    if (response.status !== 'success') {
      return
    }

    this.universalTime.setTime(response.time)

    Object.keys(response.events).forEach((event) => {
      const item = response.events[event]
      this.dispatch(item.channel.name, item.event, item.payload)
    })
  }
}
