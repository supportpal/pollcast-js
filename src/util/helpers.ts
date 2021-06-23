const urlEncode = function (obj: any, prefix?: string): string {
  const str = []
  for (const p in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, p)) {
      continue
    }

    const k = prefix ? prefix + '[' + p + ']' : p
    const v = obj[p]
    if (typeof v === 'object') {
      str.push(urlEncode(v, k))
    } else {
      str.push(encodeURIComponent(k) + '=' + encodeURIComponent(v))
    }
  }

  return str.join('&')
}

/**
 * Create a cryptographically unsecure UUID v4 identifier.
 * Use https://www.npmjs.com/package/uuid for something more reliable.
 *
 * @see https://stackoverflow.com/a/2117523
 */
const uuid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8)

    return v.toString(16)
  })
}

export {
  urlEncode,
  uuid
}
