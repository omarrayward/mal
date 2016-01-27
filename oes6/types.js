
export const malSymbol = function (arg) {
  return {value: arg, type: 'symbol'}
}

export const malKeyword = function (arg) {
  return {value: arg, type: 'keyword'}
}

export const malList = function (...args) {
  args.type = 'list'
  return args
}

export const malVector = function (...args) {
  args.type = 'vector'
  return args
}

export const malHashMap = function (...args) {
  args.type = 'hashMap'
  return args
}
