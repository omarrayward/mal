import {malList, malNil, malAtom, malString} from './types.js'
import {pr_str} from './printer.js'
import {read_str} from './reader.js'
import * as fs from 'fs'

const list = function (...args) {
  if (!args) {
    return malList()
  }
  return malList(...args)
}

const is_list = (arg) => typeof arg === 'object' && arg.type === 'list'
const is_vector = (arg) => typeof arg === 'object' && arg.type === 'vector'
const is_list_or_vector = (arg) => is_list(arg) || is_vector(arg)
const _isNil = ast => typeof ast === 'object' && ast.type === 'nil'

const is_empty = function (arg) {
  return arg.length === 0
}

const count = function (arg) {
  if (typeof arg === 'object' && arg.type === 'nil') {
    return 0
  }
  return arg.length
}

const _same_type = (arg1, arg2) => arg1.type === arg2.type
const _same_length = (arg1, arg2) => arg1.length === arg2.length
const _list_or_vector = (arg1, arg2) => is_list_or_vector(arg1) && is_list_or_vector(arg2)

const _is_same_compound_data_type = function (arg1, arg2) {
  if (!_same_length(arg1, arg2)) {
    return false
  }
  if (_same_type(arg1, arg2) || _list_or_vector(arg1, arg2)) {
    arg1.forEach((ele, index) => {
      if (!is_equal(ele, arg2[index])) {
        return false
      }
    })
    // each element in both compounds data types are equal to each other
    return true
  }
  return false
}

const is_equal = function (arg1, arg2) {
  if (typeof arg1 !== 'object') {
    return arg1 === arg2
  } else if (arg1.type === 'nil') {
    return arg2.type === 'nil'
  } else if (['symbol', 'keyword'].indexOf(arg1.type) !== -1 && _same_type(arg1, arg2)) {
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
  return malString(fs.readFileSync(fileName, 'utf8'))
}

const atom = arg => malAtom(arg)
const is_atom = arg => typeof arg === 'object' && arg.type === 'atom'
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
  'rest': rest
}
