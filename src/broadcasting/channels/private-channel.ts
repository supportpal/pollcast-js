import { Channel } from './channel'

/**
 * This class represents a Socket.io private channel.
 */
export class PrivateChannel extends Channel {
  /**
     * Trigger client event on the channel.
     */
  whisper (eventName: string, data: any): PrivateChannel {
    this.socket.emit(this.name, `client-${eventName}`, data);

    return this
  }
}
