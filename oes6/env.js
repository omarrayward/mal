export class Env {
  constructor (outer, binds = [], exprs = []) {
    this.data = {'outer': outer}

    for (let index = 0; index < binds.length; index++) {
      if (binds[index].value === '&') {
        this.data[binds[index + 1].value] = exprs.slice(index)
        return
      }
      this.data[binds[index].value] = exprs[index]
    }
  }

  set (symb, malObject) {
    this.data[symb.value] = malObject
    return malObject
  }

  find (symb) {
    if (this.data[symb.value] !== undefined) {
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
