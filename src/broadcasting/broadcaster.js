import { extend } from '../util/helpers'
import Channel from './channel'
import Request from '../http/request'

class Broadcaster {
    #options
    #channels = {}
    #timer = null
    #connected = false
    #defaults = {
      routes: {
          connect: '',
          receive: ''
      },
      polling: 5,
      token: null
    }

    constructor (options) {
      this.#options = extend(this.#defaults, options)
    }

    subscribe (channel) {
      const $channel = new Channel({ channel: channel })
      if (typeof this.#channels[channel] === 'undefined') {
        this.#channels[channel] = []
      }

      this.#channels[channel].push($channel)

      return $channel
    }

    connect () {
      if (this.#connected) {
        return
      }

      const self = this

      const request = new Request('POST', this.#options.routes.connect)
      request
        .success(function (xhr) {
          const response = JSON.parse(xhr.responseText)
          if (response.status !== 'success') {
            return
          }

          self.#connected = true
          self.setTime(response.time)

          self.#poll()
        })
        .send({_token: this.#options.token})

      return this
    }

    setTime (time) {
      this.#options.time = time
    }

    #poll () {
      const self = this

      const request = new Request('POST', this.#options.routes.receive)
      request
        .success(function (xhr) {
          self.#parseResponse(xhr.responseText)
          self.#timer = setTimeout(() => {self.#poll()}, (self.#options.polling * 1000))
        })
        .send({
          time: this.#options.time,
          channels: this.#channelData(),
          _token: this.#options.token
        })

      return this
    }

    #channelData () {
      const channelData = {}
      for (const channel in this.#channels) {
        if (!Object.prototype.hasOwnProperty.call(this.#channels, channel)) {
          continue
        }

        if (typeof channelData[channel] === 'undefined') {
          channelData[channel] = []
        }

        for (let i = 0; i < this.#channels[channel].length; i++) {
          for (const key in this.#channels[channel][i].listeners) {
            channelData[channel].push(key)
          }
        }
      }

      return channelData
    }

    #parseResponse (response) {
      response = JSON.parse(response)
      if (response.status !== 'success') {
        return
      }

      this.setTime(response.time)

      for (const event in response.events) {
        if (!Object.prototype.hasOwnProperty.call(response.events, event)) {
          continue
        }

        const item = response.events[event]
        const channel = item.channel

        for (let c = 0; c < this.#channels[channel].length; ++c) {
          this.#channels[channel][c].fire(item)
        }
      }
    }
}

export default Broadcaster
