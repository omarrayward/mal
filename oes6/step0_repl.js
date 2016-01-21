const READ = arg => arg
const EVAL = arg => arg
const PRINT = arg => arg

const rep = function (arg) {
  return [READ, EVAL, PRINT].reduce((memo, func) => func(memo), arg)
}

process.stdin.setEncoding('utf8')
process.stdout.write('user> ')

process.stdin.on('readable', function () {
  const input = process.stdin.read()
  if (input) {
    process.stdout.write(rep(input))
    process.stdout.write('user> ')
  }
})
