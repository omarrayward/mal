// IMPORTANT: choose one
const RL_LIB = 'libreadline'  // NOTE: libreadline is GPL

// var RL_LIB = 'libedit'

const HISTORY_FILE = require('path').join(process.env.HOME, '.mal-history')

const ffi = require('ffi')
const fs = require('fs')

const rllib = ffi.Library(RL_LIB, {
  'readline': [ 'string', [ 'string' ] ],
  'add_history': [ 'int', [ 'string' ] ]})

let rl_history_loaded = false

export function readline (prompt) {
  prompt = prompt || 'user> '

  if (!rl_history_loaded) {
    rl_history_loaded = true
    let lines = []
    if (fs.existsSync(HISTORY_FILE)) {
      lines = fs.readFileSync(HISTORY_FILE).toString().split('\n')
    }
    // Max of 2000 lines
    lines = lines.slice(Math.max(lines.length - 2000, 0))
    for (var i = 0; i < lines.length; i++) {
      if (lines[i]) { rllib.add_history(lines[i]) }
    }
  }

  var line = rllib.readline(prompt)
  if (line) {
    rllib.add_history(line)
    try {
      fs.appendFileSync(HISTORY_FILE, line + '\n')
    } catch (exc) {
      // ignored
    }
  }
  return line
}
