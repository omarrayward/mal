import {read_str} from './reader.js'
import {pr_str} from './printer.js'

const READ = arg => read_str(arg)
const EVAL = arg => arg
const PRINT = arg => pr_str(arg, true)

const rep = function (arg) {
  return [READ, EVAL, PRINT].reduce((memo, func) => func(memo), arg)
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
