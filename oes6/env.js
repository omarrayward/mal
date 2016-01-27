export class Env {
  constructor (outer) {
    this.data = {'outer': outer}
  }

  set (symb, malObject) {
    this.data[symb.value] = malObject
    return malObject
  }

  find (symb) {
    if (this.data[symb.value]) {
      return this
    }
    if (!this.data.outer) {
      return null
    }
    return this.data.outer.find(symb)
  }

  get (symb) {
    const env = this.find(symb)
    if (!env) {
      throw Error(`${symb.value} not found`)
    }
    return env.data[symb.value]
  }

}
