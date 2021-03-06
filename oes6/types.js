
export const malSymbol = function (arg) {
  return {value: arg, _type: 'symbol'}
}

export const malNil = function () {
  return {_type: 'nil'}
}

export const malKeyword = function (arg) {
  return {_type: 'keyword', value: arg}
}

export const malList = function (...args) {
  if (!args) {
    args = []
  }
  args._type = 'list'
  return args
}

export const malVector = function (...args) {
  if (!args) {
    args = []
  }
  args._type = 'vector'
  return args
}

export const malHashMap = function (...args) {
  if (args.length % 2 !== 0) {
    throw Error('The number of arguments to create an hashMap needs to be even')
  }

  args.keys = []
  args.values = []
  args._type = 'hashMap'

  let index = 0
  while (index < args.length) {
    args.keys.push(args[index])
    args.values.push(args[index + 1])
    index += 2
  }
  return args
}

export const malString = function (arg) {
  return arg.replace(/^"/, '')
            .replace(/"$/, '')
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\')
}

export const malFunction = function (ast, params, env, fn, is_macro) {
  return {ast, params, env, fn, is_macro, _type: 'function'}
}

export const malAtom = function (value) {
  return {value, _type: 'atom'}
}

export const malError = function (value) {
  return {
    value,
    message: 'malError'
  }
}
