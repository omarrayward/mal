export const pr_str = function (malObj, print_readably = true) {
  switch (malObj._type) {
    case 'MalInteger':
      return malObj.value.toString()
    case 'MalFloat':
      return malObj.value.toString()
    case 'MalSymbol':
      return malObj.value
    case 'MalFalse':
      return 'false'
    case 'MalNil':
      return 'nil'
    case 'MalTrue':
      return 'true'
    case 'MalKeyword':
      return malObj.value
    case 'MalString':
      if (!print_readably) {
        return malObj.value
      }
      return malObj.value.replace(/\\\\/g, '\\').replace(/\\"/g, `"`).replace(/\\n/g, `\n`)
    case 'MalList':
      return `(${malObj.value.map(e => pr_str(e, print_readably)).join(' ')})`
    case 'MalVector':
      return `[${malObj.value.map(e => pr_str(e, print_readably)).join(' ')}]`
    case 'MalHashMap':
      return `{${pr_str(malObj.key, print_readably)} ${pr_str(malObj.value, print_readably)}}`
  }
}
