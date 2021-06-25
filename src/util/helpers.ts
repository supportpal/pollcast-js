/**
 * @see https://stackoverflow.com/a/32108184
 */
const isEmptyObject = function (obj : any) : boolean {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object
}

/**
 * URL encode a key value pair.
 */
const urlEncode = function (key: string, value: string): string {
  return encodeURIComponent(key) + '=' + encodeURIComponent(value)
}

/**
 * URL encode an object.
 */
const urlEncodeObject = function (obj: any, prefix?: string): string {
  const str = []
  for (const p in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, p)) {
      continue
    }

    let item
    const k = prefix ? prefix + '[' + p + ']' : p
    const v = obj[p]
    if (typeof v === 'object') {
      item = isEmptyObject(v) ? urlEncode(k, '') : urlEncodeObject(v, k);
    } else {
      item = urlEncode(k, v)
    }

    str.push(item)
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
  urlEncodeObject,
  uuid
}
