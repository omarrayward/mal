import {read_str} from './reader.js'
import {pr_str} from './printer.js'
import {MalHashMap, MalVector, MalList} from './types.js'

const repl_env = {'+': (a, b) => a + b,
                  '-': (a, b) => a - b,
                  '*': (a, b) => a * b,
                  '/': (a, b) => a / b}

const READ = arg => read_str(arg)

const eval_ast = function (ast, env) {
  switch (ast._type) {
    case 'MalSymbol':
      const func = env[ast.value]
      if (!func) {
        throw Error(`${ast.value} not found`)
      }
      return func
    case 'MalList':
      return new MalList(...ast.value.map(element => EVAL(element, env)))
    case 'MalVector':
      return new MalVector(...ast.value.map(element => EVAL(element, env)))
    case 'MalHashMap':
      return new MalHashMap(ast.key, EVAL(ast.value, env))
    default:
      return ast
  }
}

const _evalList = function (mapList, env) {
  const evaluatedList = eval_ast(mapList, env)
  const func = evaluatedList.value.shift(0)
  const args = evaluatedList.value.map(atom => atom.value)
  return read_str(func(...args).toString())
}

const EVAL = function (ast, env) {
  if (ast._type !== 'MalList') {
    return eval_ast(ast, env)
  }
  return _evalList(ast, env)
}
const PRINT = arg => pr_str(arg, false)

const rep = function (arg) {
  const ast = READ(arg)
  const result = EVAL(ast, repl_env)
  return PRINT(result)
}

process.stdin.setEncoding('utf8')
process.stdout.write('user> ')

process.stdin.on('readable', function () {
  const input = process.stdin.read()
  if (input) {
    let output
    try {
      output = rep(input.trim())
    } catch (error) {
      output = error.message
    }
    process.stdout.write(output)
    process.stdout.write('\n')
    process.stdout.write('user> ')
  }
})
