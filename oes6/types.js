
export const malSymbol = function (arg) {
  return {value: arg, type: 'symbol'}
}

export const malNil = function () {
  return {type: 'nil'}
}

export const malKeyword = function (arg) {
  return {value: arg, type: 'keyword'}
}

export const malList = function (...args) {
  if (!args) {
    args = []
  }
  args.type = 'list'
  return args
}

export const malVector = function (...args) {
  if (!args) {
    args = []
  }
  args.type = 'vector'
  return args
}

export const malHashMap = function (...args) {
  if (!args) {
    args = []
  }
  args.type = 'hashMap'
  return args
}

export const malString = function (arg) {
  return arg.replace(/^"/, '')
            .replace(/"$/, '')
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\')
}
