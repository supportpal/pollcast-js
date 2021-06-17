import { Channel as BaseChannel } from 'laravel-echo/src/channel/channel'
import { EventFormatter } from 'laravel-echo/src/util/event-formatter'
import { Socket } from '../../http/socket'

/**
 * This class represents a Socket.io channel.
 */
export class Channel extends BaseChannel {
    /**
     * The Socket.io client instance.
     */
    socket: Socket;

    /**
     * The name of the channel.
     */
    name: any;

    /**
     * Channel options.
     */
    options: any;

    /**
     * The event formatter.
     */
    eventFormatter: EventFormatter;

    /**
     * List of
     */
    private subscribedEvents: Function[] = []

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
      this.fire(this.subscribedEvents)
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
      this.subscribedEvents.push(callback)

      return this
    }

    /**
     * Register a callback to be called anytime an error occurs.
     */
    error (callback: Function): Channel {
      return this
    }

    /**
     * Run all events callbacks.
     *
     * @param {Function[]} events
     * @private
     */
    private fire (events: Function[]): void {
      const len = events.length
      for (let i = 0; i < len; i++) {
        events[i](this.socket)
      }
    }
}
