import {read_str} from './reader.js'
import {pr_str} from './printer.js'
import {malHashMap, malVector, malList, malNil, malSymbol} from './types.js'
import {Env} from './env.js'
import {ns} from './core.js'

const repl_env = new Env(null)
for (let symbol in ns) {
  repl_env.set(malSymbol(symbol), ns[symbol])
}

const eval_ast = function (ast, env) {
  if (typeof ast === 'object') {
    switch (ast.type) {
      case 'symbol':
        return env.get(ast)
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

const _isSpecialForm = function (ast) {
  return ast.length && ['def!', 'let*', 'fn*', 'do', 'if'].indexOf(ast[0].value) !== -1
}

const _isNil = ast => typeof ast === 'object' && ast.type === 'nil'

const _isFalsy = ast => _isNil(ast) || ast === false

const _isTruthy = ast => !_isFalsy(ast)

const _evalSpecialForm = function (ast, env) {
  const specialAtom = ast[0].value
  switch (specialAtom) {
    case 'def!':
      return env.set(ast[1], EVAL(ast[2], env))

    case 'do':
      const rest = ast.slice(1)
      const evalRest = eval_ast(malList(...ast.slice(1)), env)
      return evalRest[rest.length - 1]

    case 'if':
      const condition = EVAL(ast[1], env)
      if (_isTruthy(condition)) {
        return EVAL(ast[2], env)
      } else if (ast[3] === undefined) {
        return malNil()
      }
      return EVAL(ast[3], env)

    case 'fn*':
      return (...args) => {
        const funcEnv = new Env(env, ast[1], args)
        return EVAL(ast[2], funcEnv)
      }

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
  if (!ast.length) {
    return ast
  }
  const evaluatedList = eval_ast(ast, env)
  const [func, ...args] = evaluatedList
  return func(...args)
}

const _isMalList = ast => typeof ast === 'object' && ast.type === 'list'

const READ = arg => read_str(arg)
const EVAL = function (ast, env) {
  if (_isMalList(ast)) {
    return _evalList(ast, env)
  }
  return eval_ast(ast, env)
}

const PRINT = arg => pr_str(arg, true)

const rep = function (arg) {
  const ast = READ(arg)
  const result = EVAL(ast, repl_env)
  return PRINT(result)
}
rep('(def! not (fn* (a) (if a false true)))')

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
