export const pr_str = function (malObj, print_readably = true) {
  switch (typeof malObj) {
    case 'boolean':
      return malObj.toString()
    case 'number':
      return malObj.toString()
    case 'undefined':
      return 'nil'
    case 'string':
      if (!print_readably) {
        return malObj
      }
      return malObj.replace(/\\\\/g, '\\').replace(/\\"/g, `"`).replace(/\\n/g, `\n`)
    case 'object':
      switch (malObj.type) {
        case 'symbol':
          return malObj.value
        case 'keyword':
          return malObj.value
        case 'list':
          return `(${malObj.map(e => pr_str(e, print_readably)).join(' ')})`
        case 'vector':
          return `[${malObj.map(e => pr_str(e, print_readably)).join(' ')}]`
        case 'hashMap':
          return `{${pr_str(malObj[0], print_readably)} ${pr_str(malObj[1], print_readably)}}`
      }
  }
}
