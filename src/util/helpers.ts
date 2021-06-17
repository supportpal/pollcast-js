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

export {
  urlEncode
}
