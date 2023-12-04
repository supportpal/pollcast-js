import { Connector as BaseConnector } from 'laravel-echo'
import { Channel } from './channels/channel'
import { PrivateChannel } from './channels/private-channel'
import { PresenceChannel } from './channels/presence-channel'
import { Socket } from '../http/socket'

export class Connector extends BaseConnector {
  /**
   * The socket instance.
   */
  socket: Socket | undefined

  /**
   * All of the subscribed channel names.
   */
  channels: { [name: string]: Channel } = {}

  /**
   * Merge the custom options with the defaults.
   */
  protected setOptions (options: any): any {
    super.setOptions(options)

    this.options = Object.assign({
      routes: {
        connect: '',
        receive: '',
        publish: '',
        subscribe: '',
        unsubscribe: ''
      },
      polling: 5000
    }, this.options)

    return options
  }

  /**
   * Create a fresh Socket.io connection.
   */
  connect (): void {
    this.socket = new Socket(this.options, this.csrfToken())
    this.socket.connect()
  }

  /**
   * Get a channel instance by name.
   */
  channel (name: string): Channel {
    if (!this.channels[name]) {
      this.channels[name] = new Channel(this.socket, name, this.options)
    }

    return this.channels[name]
  }

  /**
   * Get a private channel instance by name.
   */
  privateChannel (name: string): PrivateChannel {
    if (!this.channels['private-' + name]) {
      this.channels['private-' + name] = new PrivateChannel(this.socket, 'private-' + name, this.options)
    }

    return this.channels['private-' + name] as PrivateChannel
  }

  /**
   * Get a presence channel instance by name.
   */
  presenceChannel (name: string): PresenceChannel {
    if (!this.channels['presence-' + name]) {
      this.channels['presence-' + name] = new PresenceChannel(
        this.socket,
        'presence-' + name,
        this.options
      )
    }

    return this.channels['presence-' + name] as PresenceChannel
  }

  /**
   * Leave the given channel, as well as its private and presence variants.
   */
  leave (name: string): void {
    const channels = [name, 'private-' + name, 'presence-' + name]

    channels.forEach((name) => {
      this.leaveChannel(name)
    })
  }

  /**
   * Leave the given channel.
   */
  leaveChannel (name: string): void {
    if (this.channels[name]) {
      this.channels[name].unsubscribe()

      delete this.channels[name]
    }
  }

  /**
   * Get the socket ID for the connection.
   */
  socketId (): string {
    return this.socket ? this.socket.id : ''
  }

  /**
   * Disconnect connection.
   */
  disconnect (): void {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}
