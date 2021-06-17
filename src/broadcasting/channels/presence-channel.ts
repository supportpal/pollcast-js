import { PresenceChannel as Channel } from 'laravel-echo/src/channel'
import { PrivateChannel } from './private-channel'

export class PresenceChannel extends PrivateChannel implements Channel {
  /**
   * Listen for when you've successfully joined a channel.
   */
  here (callback: Function): PresenceChannel {
    this.socket.on(this.name, 'pollcast:subscription_succeeded', (members: any[]) => {
      callback(members.map((m) => m.user_info))
    })

    return this
  }

  /**
   * Listen for someone joining the channel.
   */
  joining (callback: Function): PresenceChannel {
    this.socket.on(this.name, 'pollcast:member_added', (member: any) => callback(member.user_info))

    return this
  }

  /**
   * Listen for someone leaving the channel.
   */
  leaving (callback: Function): PresenceChannel {
    this.socket.on(this.name, 'pollcast:member_removed', (member: any) => callback(member.user_info))

    return this
  }
}
