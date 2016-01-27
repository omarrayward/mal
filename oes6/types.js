class MalType {
  constructor () {
    this._type = 'MalType'
  }
}

export class MalInteger extends MalType {
  constructor (arg) {
    super()
    this._type = 'MalInteger'
    this.value = parseInt(arg, 10)
  }
}

export class MalFloat extends MalType {
  constructor (arg) {
    super()
    this._type = 'MalFloat'
    this.value = parseFloat(arg)
  }
}

export class MalSymbol extends MalType {
  constructor (arg) {
    super()
    this._type = 'MalSymbol'
    this.value = arg
  }
}

export class MalList extends MalType {
  constructor (...args) {
    super()
    this._type = 'MalList'
    this.value = args
  }
}

export class MalVector extends MalType {
  constructor (...args) {
    super()
    this._type = 'MalVector'
    this.value = args
  }
}

export class MalHashMap extends MalType {
  constructor (key, value) {
    super()
    this._type = 'MalHashMap'
    this.key = key
    this.value = value
  }
}

export class MalNil extends MalType {
  constructor () {
    super()
    this._type = 'MalNil'
  }
}

export class MalTrue extends MalType {
  constructor () {
    super()
    this._type = 'MalTrue'
  }
}

export class MalFalse extends MalType {
  constructor () {
    super()
    this._type = 'MalFalse'
  }
}

export class MalString extends MalType {
  constructor (arg) {
    super()
    this._type = 'MalString'
    this.value = arg
  }
}

export class MalKeyword extends MalType {
  constructor (arg) {
    super()
    this._type = 'MalKeyword'
    this.value = arg
  }
}
