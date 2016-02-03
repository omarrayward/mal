export const pr_str = function (malObj, print_readably) {
  switch (typeof malObj) {
    case 'function':
      return '#function'
    case 'undefined':
      return ''
    case 'boolean':
      return malObj.toString()
    case 'number':
      return malObj.toString()
    case 'string':
      if (malObj[0] === ':') {
        return malObj
      }
      if (!print_readably) {
        return `${malObj}`
      }
      return `"${malObj
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/"/g, `\\"`)}"`
    case 'object':
      switch (malObj._type) {
        case 'atom':
          return `(atom ${malObj.value})`
        case 'nil':
          return 'nil'
        case 'symbol':
          return malObj.value
        case 'keyword':
          return malObj.value
        case 'list':
          return `(${malObj.map(e => pr_str(e, print_readably)).join(' ')})`
        case 'vector':
          return `[${malObj.map(e => pr_str(e, print_readably)).join(' ')}]`
        case 'hashMap':
          return `{${malObj.map(e => pr_str(e, print_readably)).join(' ')}}`
      }
  }
}
