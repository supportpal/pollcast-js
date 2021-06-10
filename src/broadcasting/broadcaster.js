import { extend } from '../util/helpers'
import Channel from './channel'
import Request from '../http/request'

class Broadcaster {
    #options
    #channels = {}
    #timer = null
    #connected = false
    #events = {}
    #defaults = {
      url: null,
      polling: 5,
      token: null
    }

    constructor (options) {
      this.#options = extend(this.#defaults, options)
    }

    on (event, callback) {
      if (typeof this.#events[event] === 'undefined') {
        this.#events[event] = []
      }

      this.#events[event].push(callback)

      return this
    }

    subscribe (channel) {
      const $channel = new Channel({ channel: channel })
      if (typeof this.#channels[channel] === 'undefined') {
        this.#channels[channel] = []
      }

      this.#channels[channel].push($channel)

      return $channel
    }

    fire (event, data) {
      if (typeof this.#events[event] === 'undefined') {
        this.#events[event] = []
      }

      for (const callback in this.#events[event]) {
        if (Object.prototype.hasOwnProperty.call(this.#events[event], callback)) {
          this.#events[event][callback](data)
        }
      }
    }

    connect () {
      if (this.#connected) {
        return
      }

      const self = this

      const request = new Request('POST', this.#options.url + '/connect')
      request
        .success(function (xhr) {
          const response = JSON.parse(xhr.responseText)
          if (response.status !== 'success') {
            return
          }

          self.#connected = true
          self.setTime(response.time)
          self.fire('connect', self)

          self.#poll()
        })
        .send({
          polling: this.#options.polling,
          _token: this.#options.token
        })

      return this
    }

    disconnect () {
      this.#connected = false
      clearTimeout(this.#timer)
      this.#timer = null
      this.fire('disconnect', this)

      return this
    }

    setTime (time) {
      this.#options.time = time
    }

    #poll () {
      const self = this

      const request = new Request('POST', this.#options.url + '/receive')
      request
        .success(function (xhr) {
          self.#parseResponse(xhr.responseText)
          self.#timer = setTimeout(self.#poll, (self.#options.polling * 1000))
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
          const obj = this.#channels[channel][i]
          const events = obj.events
          for (const key in events) {
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

      for (const payload in response.payloads) {
        if (!Object.prototype.hasOwnProperty.call(response.payloads, payload)) {
          continue
        }

        for (let i = 0; i < response.payloads[payload].channels.length; ++i) {
          const channel = response.payloads[payload].channels[i]
          for (let index = 0; index < this.#channels[channel].length; ++index) {
            this.#channels[channel][index].fire(response.payloads[payload])
          }
        }
      }
    }
}

export default Broadcaster
