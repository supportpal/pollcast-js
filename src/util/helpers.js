const extend = function (source, properties) {
  for (const property in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, property)) {
      source[property] = properties[property]
    }
  }

  return source
}

const serialize = function (obj, prefix) {
  const str = []
  for (const p in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, p)) {
      continue
    }

    const k = prefix ? prefix + '[' + p + ']' : p; const v = obj[p]
    if (typeof v === 'object') {
      str.push(serialize(v, k))
    } else {
      str.push(encodeURIComponent(k) + '=' + encodeURIComponent(v))
    }
  }

  return str.join('&')
}

export {
  extend,
  serialize
}
