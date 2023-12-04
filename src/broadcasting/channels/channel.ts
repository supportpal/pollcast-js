import { Channel as BaseChannel, EventFormatter } from 'laravel-echo'
import { Socket } from '../../http/socket'

/**
 * This class represents a Socket.io channel.
 */
export class Channel extends BaseChannel {
  /**
   * The Socket.io client instance.
   */
  socket: Socket

  /**
   * The name of the channel.
   */
  name: any

  /**
   * Channel options.
   */
  options: any

  /**
   * The event formatter.
   */
  eventFormatter: EventFormatter

  /**
   * Create a new class instance.
   */
  constructor (socket: any, name: string, options: any) {
    super()

    this.name = name
    this.socket = socket
    this.options = options
    this.eventFormatter = new EventFormatter(this.options.namespace)

    this.subscribe()
  }

  /**
   * Subscribe to a channel.
   */
  subscribe (): void {
    this.socket.subscribe(this.name)
  }

  /**
   * Unsubscribe from channel.
   */
  unsubscribe (): void {
    this.socket.unsubscribe(this.name)
  }

  /**
   * Listen for an event on the channel instance.
   */
  listen (event: string, callback: Function): Channel {
    this.socket.on(this.name, this.eventFormatter.format(event), callback)

    return this
  }

  /**
     * Stop listening for an event on the channel instance.
     */
  stopListening (event: string, callback?: Function): Channel {
    this.socket.off(this.name, this.eventFormatter.format(event), callback)

    return this
  }

  /**
   * Register a callback to be called anytime a subscription succeeds.
   */
  subscribed (callback: Function): Channel {
    this.socket.on(this.name, 'pollcast:subscription_succeeded', callback)

    return this
  }

  /**
   * Register a callback to be called anytime an error occurs.
   */
  error (callback: Function): Channel {
    return this
  }
}
