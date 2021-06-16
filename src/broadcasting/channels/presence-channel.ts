import { PresenceChannel as Channel } from 'laravel-echo/src/channel'
import { PrivateChannel } from './private-channel'

export class PresenceChannel extends PrivateChannel implements Channel {
  /**
   * Register a callback to be called anytime the member list changes.
   */
  here (callback: Function): PresenceChannel {
    this.on('presence:subscribed', (members: any[]) => {
      callback(members.map((m) => m.user_info))
    })

    return this
  }

  /**
   * Listen for someone joining the channel.
   */
  joining (callback: Function): PresenceChannel {
    this.on('presence:joining', (member: any) => callback(member.user_info))

    return this
  }

  /**
   * Listen for someone leaving the channel.
   */
  leaving (callback: Function): PresenceChannel {
    this.on('presence:leaving', (member: any) => callback(member.user_info))

    return this
  }
}
