export class Env {
  constructor (outer) {
    this.data = new Map([
      ['outer', outer]
    ])
  }

  set (symb, malObject) {
    this.data.set(symb, malObject)
    return malObject
  }

  find (symb) {
    if (this.data.get(symb)) {
      return this
    }
    if (!this.data.get('outer')) {
      return null
    }
    return this.data.get('outer').find(symb)
  }

  get (symb) {
    const env = this.find(symb)
    if (!env) {
      throw Error(`${symb} not found`)
    }
    return env.data.get(symb)
  }

}
