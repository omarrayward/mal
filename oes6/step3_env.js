import {read_str} from './reader.js'
import {pr_str} from './printer.js'
import {MalHashMap, MalVector, MalList} from './types.js'
import {Env} from './env.js'

const repl_env = new Env(null)
repl_env.set('+', (a, b) => a + b)
repl_env.set('-', (a, b) => a - b)
repl_env.set('*', (a, b) => a * b)
repl_env.set('/', (a, b) => a / b)

const READ = arg => read_str(arg)

const eval_ast = function (ast, env) {
  switch (ast._type) {
    case 'MalSymbol':
      const func = env.get(ast.value)
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

const _evalList = function (ast, env) {
  switch (ast.value[0].value) {
    case 'def!':
      return env.set(ast.value[1].value, EVAL(ast.value[2], env))

    case 'let*':
      const newEnv = new Env(env)
      if (ast.value[1].value.length % 2 !== 0) {
        throw Error('The first argument of let* should be a MapList with even objects')
      }

      while (ast.value[1].value.length) {
        const [symb, val] = ast.value[1].value.splice(0, 2)
        const evaluatedValue = EVAL(val, newEnv)
        newEnv.set(symb.value, evaluatedValue)
      }

      return EVAL(ast.value[2], newEnv)

    default:

      const evaluatedList = eval_ast(ast, env)
      const func = evaluatedList.value.shift()
      const args = evaluatedList.value.map(atom => atom.value)
      return read_str(func(...args).toString())
  }
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
