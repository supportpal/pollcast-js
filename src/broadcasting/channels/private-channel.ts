import { Channel } from './channel'

export class PrivateChannel extends Channel {
  /**
   * Trigger client event on the channel.
   */
  whisper (eventName: string, data: any): this {
    this.socket.emit(this.name, `client-${eventName}`, data)

    return this
  }
}
