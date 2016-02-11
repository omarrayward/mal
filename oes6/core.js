import {malList, malNil, malAtom, malSymbol, malHashMap, malVector, malKeyword, malError} from './types.js'
import {pr_str} from './printer.js'
import { readline } from './node_readline'
import {read_str} from './reader.js'
import * as fs from 'fs'

const list = function (...args) {
  if (!args) {
    return malList()
  }
  return malList(...args)
}

const is_list = (arg) => typeof arg === 'object' && arg._type === 'list'
const is_vector = (arg) => typeof arg === 'object' && arg._type === 'vector'
const is_list_or_vector = (arg) => is_list(arg) || is_vector(arg)
const is_hash_map = ast => typeof ast === 'object' && ast._type === 'hashMap'
const _isNil = ast => typeof ast === 'object' && ast._type === 'nil'
const _isTrue = ast => ast === true
const _isFalse = ast => ast === false
const _isSymbol = ast => typeof ast === 'object' && ast._type === 'symbol'
const _isKeyword = ast => typeof ast === 'object' && ast._type === 'keyword'
const _toSymbol = (ast) => malSymbol(ast)
const _toKeyword = (ast) => malKeyword(`:${ast}`)

const is_empty = function (arg) {
  return arg.length === 0
}

const count = function (arg) {
  if (typeof arg === 'object' && arg._type === 'nil') {
    return 0
  }
  if (arg._type === 'list' && arg.length === 1 && count(arg[0]) === 0) {
    return 0
  }
  return arg.length
}

const _same_type = (arg1, arg2) => arg1._type === arg2._type
const _same_length = (arg1, arg2) => arg1.length === arg2.length
const _list_or_vector = (arg1, arg2) => is_list_or_vector(arg1) && is_list_or_vector(arg2)
const _is_same_list_or_vector = function (arg1, arg2) {
  arg1.forEach((ele, index) => {
    if (!is_equal(ele, arg2[index])) {
      return false
    }
  })
  return true
}

const _has_same_keys = function (arg1, arg2) {
  arg1.forEach((ele) => {
    if (_getIndex(arg2, ele) === -1) {
      return false
    }
  })
  return true
}

const _has_same_values_for_keys = function (arg1, arg2) {
  for (let index = 0; index < arg1.keys.length; index++) {
    let key = arg1.keys[index]
    if (!is_equal(get(arg1, key), get(arg2, key))) {
      return false
    }
  }
  return true
}

const _is_same_compound_data_type = function (arg1, arg2) {
  if (!_same_length(arg1, arg2)) {
    return false
  }
  if (_list_or_vector(arg1, arg2)) {
    return _is_same_list_or_vector(arg1, arg2)
  } else if (is_hash_map(arg1) && is_hash_map(arg2)) { // both are hashmaps
    return _has_same_keys(arg1, arg2) && _has_same_values_for_keys(arg1, arg2)
  }
  return false
}

const is_equal = function (arg1, arg2) {
  if (typeof arg1 !== 'object') {
    return arg1 === arg2
  } else if (arg1._type === 'nil') {
    return arg2._type === 'nil'
  } else if (['symbol', 'keyword'].indexOf(arg1._type) !== -1 && _same_type(arg1, arg2)) {
    return arg1.value === arg2.value
  }
  return _is_same_compound_data_type(arg1, arg2)
}

const lessThan = (arg1, arg2) => arg1 < arg2
const lessOrEqualThan = (arg1, arg2) => arg1 <= arg2
const moreThan = (arg1, arg2) => arg1 > arg2
const moreOrEqualThan = (arg1, arg2) => arg1 >= arg2

const print_string = function (...args) {
  const result = args.map(arg => pr_str(arg, true)).join(' ')
  return `${result}`
}

const str = function (...args) {
  const result = args.map(arg => pr_str(arg, false)).join('')
  return `${result}`
}

const prn = function (...args) {
  console.log(`${args.map(arg => pr_str(arg, true)).join(' ')}`)
  return malNil()
}

const println = function (...args) {
  console.log(args.map(arg => pr_str(arg, false)).join(' '))
  return malNil()
}

const file_reader = function (fileName) {
  return fs.readFileSync(fileName, 'utf8')
}

const atom = arg => malAtom(arg)
const is_atom = arg => typeof arg === 'object' && arg._type === 'atom'
const deref = atom => atom.value
const reset = function (atom, value) {
  atom.value = value
  return value
}

const swap = function (atom, func, ...funcs) {
  const args = [atom.value, ...funcs]
  if (typeof func === 'function') {
    atom.value = func(...args)
  } else {
    atom.value = func.fn(...args)
  }
  return atom.value
}

const concat = (...args) => malList(...malList().concat(...args))
const cons = (arg, rest) => malList(arg, ...rest)
const conj = function (list, ...args) {
  if (list._type === 'list') {
    return malList(...args.reverse(), ...list)
  }
  return malVector(...list, ...args)
}

const nth = function (list_or_vector, index) {
  const element = list_or_vector[index]
  if (element === undefined) {
    throw Error(`There is no element for ${list_or_vector} at index ${index}`)
  }
  return element
}

const first = function (list_or_vector) {
  if (_isNil(list_or_vector)) {
    return list_or_vector
  }
  if (is_list_or_vector(list_or_vector)) {
    if (is_empty(list_or_vector)) {
      return malNil()
    }
    return list_or_vector[0]
  }
  throw Error('Expected list or vector as argument of first')
}

const rest = function (list_or_vector) {
  if (is_list_or_vector(list_or_vector)) {
    const result = malList(...list_or_vector.slice(1))
    return result
  }
  throw Error('Expected list or vector as argument of rest')
}

const _throw = function (malObj) {
  throw malError(malObj)
}

const apply = function (func, ...args) {
  const list_or_vector = args[args.length - 1]
  const other_args = args.slice(0, args.length - 1)
  const allArgs = concat(other_args, list_or_vector)
  if (typeof func === 'function') {
    return func(...allArgs)
  }
  return func.fn(...allArgs)
}

const map = function (func, list_or_vector) {
  const executable = typeof func === 'function' ? func : func.fn
  return malList(...list_or_vector.map(executable))
}

const _cloneHashMap = function (hashMap) {
  const newHashmap = malHashMap()
  hashMap.forEach(e => newHashmap.push(e))
  hashMap.keys.forEach(e => newHashmap.keys.push(e))
  hashMap.values.forEach(e => newHashmap.values.push(e))
  return newHashmap
}

const assoc = function (hashMap, ...args) {
  if (args.length % 2 !== 0) {
    throw Error('The number of arguments to create an hashMap needs to be even')
  }
  const newHashmap = _cloneHashMap(hashMap)
  let index = 0
  while (index < args.length) {
    let key = args[index]
    let value = args[index + 1]
    if (newHashmap.keys.indexOf(key) === -1) {
      newHashmap.push(key)
      newHashmap.push(value)
      newHashmap.keys.push(key)
      newHashmap.values.push(value)
    } else {
      const keyIndex = newHashmap.keys.indexOf(key)
      newHashmap.values[keyIndex] = value
      newHashmap[(keyIndex * 2) - 1] = value
    }
    index += 2
  }
  return newHashmap
}

const dissoc = function (hashMap, ...args) {
  const newHashmap = []
  hashMap.keys.forEach(key => {
    if (_getIndex(args, key) === -1) {
      newHashmap.push(key)
      newHashmap.push(hashMap.values[hashMap.keys.indexOf(key)])
    }
  })
  return malHashMap(...newHashmap)
}

const get = function (hashMap, key) {
  if (_isNil(hashMap)) {
    return hashMap
  }

  const index = _getIndex(hashMap.keys, key)
  if (index !== -1) {
    return hashMap.values[index]
  }
  return malNil()
}

const _getIndexForKeyword = function (keys, key) {
  for (let index = 0; index < keys.length; index++) {
    if (_isKeyword(keys[index]) && keys[index].value === key.value) {
      return index
    }
  }
  return -1
}

const _getIndex = function (keys, key) {
  if (_isKeyword(key)) {
    return _getIndexForKeyword(keys, key)
  }
  return keys.indexOf(key)
}

const contains = function (hashMap, key) {
  return _getIndex(hashMap.keys, key) !== -1
}

const with_meta = function (malObj, m) {
  const newObj = Object.create(malObj)
  newObj.meta = m
  return newObj
}

export const ns = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  'list': list,
  'list?': is_list,
  'empty?': is_empty,
  'count': count,
  '=': is_equal,
  '<': lessThan,
  '<=': lessOrEqualThan,
  '>': moreThan,
  '>=': moreOrEqualThan,
  'pr-str': print_string,
  'str': str,
  'prn': prn,
  'println': println,
  'read-string': read_str,
  'slurp': file_reader,
  'atom': atom,
  'atom?': is_atom,
  'deref': deref,
  'reset!': reset,
  'swap!': swap,
  'cons': cons,
  'concat': concat,
  'nth': nth,
  'first': first,
  'rest': rest,
  'throw': _throw,
  'apply': apply,
  'map': map,
  'nil?': _isNil,
  'true?': _isTrue,
  'false?': _isFalse,
  'symbol?': _isSymbol,
  'symbol': _toSymbol,
  'keyword': _toKeyword,
  'keyword?': _isKeyword,
  'vector': (...args) => malVector(...args),
  'vector?': ast => typeof ast === 'object' && ast._type === 'vector',
  'hash-map': (...args) => malHashMap(...args),
  'map?': is_hash_map,
  'assoc': assoc,
  'dissoc': dissoc,
  'get': get,
  'contains?': contains,
  'keys': (hashMap) => malList(...hashMap.keys),
  'vals': (hashMap) => malList(...hashMap.values),
  'sequential?': is_list_or_vector,
  'readline': readline,
  'with-meta': with_meta,
  'meta': arg => arg.meta || malNil(),
  'conj': conj
}
