import {read_str} from './reader.js'
import {pr_str} from './printer.js'
import {malHashMap, malVector, malList} from './types.js'

const repl_env = {'+': (a, b) => a + b,
                  '-': (a, b) => a - b,
                  '*': (a, b) => a * b,
                  '/': (a, b) => a / b}

const eval_ast = function (ast, env) {
  if (typeof ast === 'object') {
    switch (ast.type) {
      case 'symbol':
        const func = env[ast.value]
        if (!func) {
          throw Error(`${ast.value} not found`)
        }
        return func
      case 'list':
        return malList(...ast.map(element => EVAL(element, env)))
      case 'vector':
        return malVector(...ast.map(element => EVAL(element, env)))
      case 'hashMap':
        return malHashMap(ast[0], EVAL(ast[1], env))
      default:
        return ast
    }
  }
  return ast
}

const _evalList = function (malList, env) {
  const evaluatedList = eval_ast(malList, env)
  const [func, ...args] = evaluatedList
  return func(...args)
}

const _isMalList = ast => typeof ast === 'object' && ast.type === 'list'

const READ = arg => read_str(arg)
const EVAL = (ast, env) => _isMalList(ast) && _evalList(ast, env) || eval_ast(ast, env)
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
