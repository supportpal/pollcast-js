export class SessionStorage {
  private readonly key

  constructor (key : string) {
    this.key = key
  }

  get () : any {
    let data = sessionStorage.getItem(this.key)
    if (data === null) {
      return {}
    }

    try {
      data = JSON.parse(data)
      if (typeof data === 'object') {
        return data
      }

      return {}
    } catch (err) {
      return {}
    }
  }

  set (key : string, value : any) : void {
    const data = this.get()
    data[key] = value

    sessionStorage.setItem(this.key, JSON.stringify(data))
  };
}
