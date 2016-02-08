import {read_str} from './reader.js'
import {pr_str} from './printer.js'
import {malHashMap, malVector, malList, malSymbol} from './types.js'
import {Env} from './env.js'

const repl_env = new Env(null)
repl_env.set(malSymbol('+'), (a, b) => a + b)
repl_env.set(malSymbol('-'), (a, b) => a - b)
repl_env.set(malSymbol('*'), (a, b) => a * b)
repl_env.set(malSymbol('/'), (a, b) => a / b)

const eval_ast = function (ast, env) {
  if (typeof ast === 'object') {
    switch (ast._type) {
      case 'symbol':
        return env.get(ast)
      case 'list':
        return malList(...ast.map(element => EVAL(element, env)))
      case 'vector':
        return malVector(...ast.map(element => EVAL(element, env)))
      case 'hashMap':
        return malHashMap(...ast.map(element => EVAL(element, env)))
      default:
        return ast
    }
  }
  return ast
}

const _isSpecialForm = ast => ['def!', 'let*'].indexOf(ast[0].value) !== -1

const _evalSpecialForm = function (ast, env) {
  const specialAtom = ast[0].value
  switch (specialAtom) {
    case 'def!':
      return env.set(ast[1], EVAL(ast[2], env))

    case 'let*':
      const newEnv = new Env(env)
      if (ast[1].length % 2 !== 0) {
        throw Error('The first argument of let* should be a MapList with even objects')
      }

      while (ast[1].length) {
        const [symb, val] = ast[1].splice(0, 2)
        const evaluatedValue = EVAL(val, newEnv)
        newEnv.set(symb, evaluatedValue)
      }

      return EVAL(ast[2], newEnv)
  }
}

const _evalList = function (ast, env) {
  if (_isSpecialForm(ast)) {
    return _evalSpecialForm(ast, env)
  }

  const evaluatedList = eval_ast(ast, env)
  const [func, ...args] = evaluatedList
  return func(...args)
}

const _isMalList = ast => typeof ast === 'object' && ast._type === 'list'

const READ = arg => read_str(arg)
const EVAL = (ast, env) => _isMalList(ast) && _evalList(ast, env) || eval_ast(ast, env)
const PRINT = arg => pr_str(arg, true)

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
