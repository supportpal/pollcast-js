;(function () {
  this.Polycast = function () {
    this.options = {}

    this.channels = {}

    this.timeout = null

    this.connected = false

    this.events = {}

    const defaults = {
      url: null,
      polling: 5,
      token: null
    }

    if (arguments[0] && typeof arguments[0] === 'object') {
      this.options = this.extend(defaults, arguments[0])
    } else if (arguments[0] && typeof arguments[0] === 'string') {
      if (arguments[1] && typeof arguments[1] === 'object') {
        const opts = this.extend({ url: arguments[0] }, arguments[1])
        this.options = this.extend(defaults, opts)
      } else {
        this.options = this.extend(defaults, { url: arguments[0] })
      }
    } else {
      throw new Error('Polycast url must be defined!')
    }

    this.init()

    return this
  }

  this.Polycast.prototype = {
    init: function () {
      const PolycastObject = this

      const params = this.serialize({
        polling: this.options.polling,
        _token: this.options.token
      })

      const xhr = new XMLHttpRequest()
      xhr.open('POST', this.options.url + '/connect')
      xhr.onreadystatechange = function () {
        if (xhr.readyState > 3 && xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          if (response.status === 'success') {
            PolycastObject.connected = true
            PolycastObject.setTime(response.time)
            PolycastObject.setTimeout()
            console.log('Polycast connection established!')
            PolycastObject.fire('connect', PolycastObject)
          }
        }
      }
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.send(params)

      return this
    },
    reconnect: function () {
      if (this.connected) {
        return
      }
      this.init()
      return this
    },
    on: function (event, callback) {
      if (this.events[event] === undefined) {
        this.events[event] = []
      }
      this.events[event].push(callback)
      return this
    },
    fire: function (event, data) {
      if (this.events[event] === undefined) {
        this.events[event] = []
      }
      for (const callback in this.events[event]) {
        if (Object.prototype.hasOwnProperty.call(this.events[event], callback)) {
          const func = this.events[event][callback]
          func(data)
        }
      }
    },
    disconnect: function () {
      this.connected = false
      clearTimeout(this.timeout)
      this.timeout = null
      this.fire('disconnect', this)
      return this
    },
    extend: function (source, properties) {
      let property
      for (property in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, property)) {
          source[property] = properties[property]
        }
      }
      return source
    },
    setTime: function (time) {
      this.options.time = time
    },
    setTimeout: function () {
      const PolycastObject = this
      this.timeout = setTimeout(function () {
        PolycastObject.fetch()
      }, (this.options.polling * 1000))
    },
    fetch: function () {
      this.request()
    },
    request: function () {
      const PolycastObject = this

      // serialize just the channel names and events attached
      const channelData = {}
      for (const channel in this.channels) {
        if (Object.prototype.hasOwnProperty.call(this.channels, channel)) {
          if (channelData[channel] === undefined) {
            channelData[channel] = []
          }
          for (let i = 0; i < this.channels[channel].length; i++) {
            const obj = this.channels[channel][i]
            const events = obj.events
            for (const key in events) {
              channelData[channel].push(key)
            }
          }
        }
      }

      const data = {
        time: this.options.time,
        channels: channelData,
        _token: this.options.token
      }

      const params = this.serialize(data)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', this.options.url + '/receive')
      xhr.onreadystatechange = function () {
        if (xhr.readyState > 3 && xhr.status === 200) {
          PolycastObject.parseResponse(xhr.responseText)
        }
      }
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.send(params)

      return xhr
    },
    serialize: function (obj, prefix) {
      const str = []
      for (const p in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, p)) {
          const k = prefix ? prefix + '[' + p + ']' : p; const v = obj[p]
          str.push(typeof v === 'object'
            ? this.serialize(v, k)
            : encodeURIComponent(k) + '=' + encodeURIComponent(v))
        }
      }
      return str.join('&')
    },
    parseResponse: function (response) {
      response = JSON.parse(response)
      if (response.status === 'success') {
        // do something
        this.setTime(response.time)

        for (const payload in response.payloads) {
          if (Object.prototype.hasOwnProperty.call(response.payloads, payload)) {
            // foreach payload channels defer to channel class
            for (let i = 0; i < response.payloads[payload].channels.length; ++i) {
              const channel = response.payloads[payload].channels[i]
              // console.log('Polycast channel: ' + channel + ' received event: ' + response.payloads[payload]['event']);
              for (let index = 0; index < this.channels[channel].length; ++index) {
                // console.log(response.payloads[payload]);
                this.channels[channel][index].fire(response.payloads[payload])
                // this.channels[channel][index].fire(response.payloads[payload]['event'], response.payloads[payload]['payload'], response.payloads[payload]['delay']);
              }
            }
          }
        }

        // lets do it again!
        this.setTimeout()
      }
    },
    subscribe: function (channel) {
      const $channel = new PolycastChannel({ channel: channel })
      if (this.channels[channel] === undefined) {
        this.channels[channel] = []
      }
      this.channels[channel].push($channel)
      return $channel
    }
  }

  this.PolycastChannel = function () {
    this.options = {}

    this.events = {}

    const defaults = {
      channel: null
    }

    if (arguments[0] && typeof arguments[0] === 'object') {
      this.options = this.extend(defaults, arguments[0])
    } else {
      throw new Error('Polycast channel options must be defined!')
    }
  }

  this.PolycastChannel.prototype = {
    init: function () {
      return this
    },
    extend: function (source, properties) {
      let property
      for (property in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, property)) {
          source[property] = properties[property]
        }
      }
      return source
    },
    on: function (event, callback) {
      if (this.events[event] === undefined) {
        this.events[event] = []
      }
      this.events[event].push(callback)
      return this
    },
    fire: function (event) {
      for (const e in this.events) {
        if (Object.prototype.hasOwnProperty.call(this.events, e)) {
          if (e === event.event) {
            const func = this.events[e]
            if (event.delay !== 0) {
              setTimeout(function () {
                func[0](event.payload, event)
              }, (event.delay * 1000))
            } else {
              func[0](event.payload, event)
            }
          }
        }
      }
    }
  }

  module.exports = this.Polycast
}())
