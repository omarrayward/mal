import {read_str} from './reader.js'
import {pr_str} from './printer.js'
import {malHashMap, malVector, malList, malNil, malSymbol, malFunction} from './types.js'
import {Env} from './env.js'
import {ns} from './core.js'

const commandLineArgs = process.argv.slice(2)

const repl_env = new Env(null)
for (let symbol in ns) {
  repl_env.set(malSymbol(symbol), ns[symbol])
}
repl_env.set(malSymbol('eval'), (ast) => EVAL(ast, repl_env))
repl_env.set(malSymbol('*ARGV*'), malList(commandLineArgs.slice(1)))

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

const _isSpecialForm = (ast) =>
  ast.length && ['def!',
                 'let*',
                 'fn*',
                 'do',
                 'if',
                 'quote',
                 'quasiquote',
                 'defmacro!',
                 'macroexpand'].indexOf(ast[0].value) !== -1

const _isNil = ast => typeof ast === 'object' && ast.type === 'nil'

const _isFalsy = ast => _isNil(ast) || ast === false

const _isTruthy = ast => !_isFalsy(ast)

const _isMalList = ast => typeof ast === 'object' && ast.type === 'list'
const _isMalVector = ast => typeof ast === 'object' && ast.type === 'vector'

const _isPair = ast => (_isMalList(ast) || _isMalVector(ast)) && ast.length > 0

const _isSymbol = ast => typeof ast === 'object' && ast.type === 'symbol'

const _isUnquoteSymbol = ast => _isSymbol(ast) && ast.value === 'unquote'

const _isSpliceUnquoteSymbol = ast =>
  _isSymbol(ast) && ast.value === 'splice-unquote'

const quasiquote = function (ast) {
  if (!_isPair(ast)) {
    return malList(malSymbol('quote'), ast)
  } else if (_isUnquoteSymbol(ast[0])) {
    return ast[1]
  } else if (_isPair(ast[0]) && _isSpliceUnquoteSymbol(ast[0][0])) {
    const result = malList(malSymbol('concat'), ast[0][1], quasiquote(malList(...ast.slice(1))))
    return result
  }
  const result = malList(malSymbol('cons'), quasiquote(ast[0]), quasiquote(malList(...ast.slice(1))))
  return result
}

const is_macro_call = function (ast, env) {
  return _isMalList(ast) && _isSymbol(ast[0]) && env.find(ast[0]) && env.get(ast[0]).is_macro
}

const macroexpand = function (ast, env) {
  while (is_macro_call(ast, env)) {
    const macroFn = env.get(ast[0])
    const args = ast.slice(1)
    ast = macroFn.fn(...args)
  }
  return ast
}

const READ = arg => read_str(arg)
const EVAL = function (ast, env) {
  while (true) {
    // console.log('EVAL:', pr_str(ast))
    ast = macroexpand(ast, env)
    if (!_isMalList(ast)) {
      return eval_ast(ast, env)
    }
    if (!ast.length) {
      return ast
    }
    if (_isSpecialForm(ast)) {
      const specialAtom = ast[0].value
      switch (specialAtom) {
        case 'def!':
          const binds = ast[1]
          const expres = EVAL(ast[2], env)
          env.set(binds, expres)
          return expres

        case 'defmacro!':
          const bind = ast[1]
          const _func = EVAL(ast[2], env)
          _func.is_macro = true
          env.set(bind, _func)
          return _func

        case 'macroexpand':
          return macroexpand(ast[1], env)

        case 'do':
          const rest = ast.slice(1)
          const last = rest.pop()
          eval_ast(malList(...rest), env)
          ast = last
          continue

        case 'quote':
          return ast[1]

        case 'quasiquote':
          ast = quasiquote(ast[1])
          continue

        case 'if':
          const condition = EVAL(ast[1], env)
          if (_isTruthy(condition)) {
            ast = ast[2]
            continue
          } else if (ast[3] === undefined) {
            return malNil()
          } else {
            ast = ast[3]
            continue
          }
          break

        case 'fn*':
          const params = ast[1]
          const body = ast[2]
          const func = function (...args) {
            const funcEnv = new Env(env, params, args)
            return EVAL(body, funcEnv)
          }
          const is_macro = false
          return malFunction(body, params, env, func, is_macro)

        case 'let*':
          const newEnv = new Env(env)
          if (ast[1].length % 2 !== 0) {
            throw Error('The first argument of let* should be a malList with even objects')
          }

          let index = 0
          while (ast[1].length > index) {
            const [symb, val] = ast[1].slice(index, index + 2)
            const evaluatedValue = EVAL(val, newEnv)
            newEnv.set(symb, evaluatedValue)
            index = index + 2
          }

          env = newEnv
          ast = ast[2]
          continue
      }
    }

    const evaluatedList = eval_ast(ast, env)
    const [func, ...args] = evaluatedList
    if (typeof func === 'function') {
      return func(...args)
    }
    ast = func.ast
    env = new Env(func.env, func.params, args)
  }
}

const PRINT = arg => pr_str(arg, true)

const rep = function (arg) {
  const ast = READ(arg)
  const result = EVAL(ast, repl_env)
  return PRINT(result)
}
rep('(def! not (fn* (a) (if a false true)))')
rep(`(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) ")")))))`)
rep(`(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw "odd number of forms to cond")) (cons 'cond (rest (rest xs)))))))`)
rep('(defmacro! or (fn* (& xs) (if (empty? xs) nil (if (= 1 (count xs)) (first xs) `(let* (or_FIXME ~(first xs)) (if or_FIXME or_FIXME (or ~@(rest xs)))) ))))')
if (commandLineArgs.length) {
  rep(`(load-file "${commandLineArgs[0]}")`)
  process.exit(0)
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
    if (output !== undefined) {
      process.stdout.write(output)
      process.stdout.write('\n')
    }
    process.stdout.write('user> ')
  }
})
