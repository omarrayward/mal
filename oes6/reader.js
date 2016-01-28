import {
  malHashMap,
  malList,
  malNil,
  malString,
  malSymbol,
  malVector,
  malKeyword,
} from './types.js'
import * as ddoc from './doc.js'
import * as assert from 'assert'

ddoc.module(module, {
  doc: `
    Parses a source string into an AST.
    e.g.:

    123 -> 123

    (+ 1 2) -> List(Symbol(+), 1, 2)

    (+ 1 (+ 2 3)) -> List(Symbol(+), 1, List(Symbol(+), 2, 3))
  `,
})

ddoc.fn('read_str', {
  doc: 'Parses a source string into an AST.',
  shape: 'String -> Mal data type',
  args: [
    'Mal source code',
  ],
  returns: 'Mal AST',
  examples: {
    'atoms': (fn) => {
      assert.equal(fn('123'), 123)
      assert.equal(fn('123.45'), 123.45)
      assert.equal(fn('"hello world"'), 'hello world')
    },
    'compound data types': (fn) => {
      assert.deepEqual(fn('(+ 1 2)'), malList(malSymbol('+'), 1, 2))
      assert.deepEqual(fn('[1 2 3]'), malVector(1, 2, 3))
      assert.deepEqual(fn('{"key" value}'), malHashMap('key', malSymbol('value')))
    },
    'empty string': (fn) => {
      assert.equal(fn(''), undefined)
    },
  },
})

export const read_str = function (str) {
  try {
    const reader = new Reader(str)
    return read_form(reader)
  } catch (e) {
    return undefined
  }
}

class Reader {
  constructor (str) {
    [this.currentToken, this.restStr] = read_next_token(str)
    if (!this.currentToken) {
      throw Error('Blank input')
    }
  }

  next () {
    const currentToken = this.currentToken
    const [newToken, restStr] = read_next_token(this.restStr)
    this.currentToken = newToken
    this.restStr = restStr
    return currentToken
  }

  peek () {
    return this.currentToken
  }
}

const tokenizerRegexp =
  // [\s,]* => any number of whitespaces or commas (not tokenized, ignored)
  // ~@ => sequence of those 2 characters (tokenized)
  // [\[\]{}()'`~^@] => any of []{}'`~^@ (tokenized)
  // "(?:\\.|[^\\"])*" => any double quoted string not ending in \ (tokenized)
  // ;.* => any sequence of characters starting with ; (tokenized)
  // [^\s\[\]{}('"`,;)]+ => any sequence of characters without \s []{}('"`;) (tokenized)
  /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"|;.*|[^\s\[\]{}('"`,;)]+)/g

ddoc.fn('tokenizer', {
  doc: 'Parses a source string into a list of tokens.',
  shape: 'String -> Array',
  args: [
    'Mal source code',
  ],
  returns: 'token list',
  examples: {
    'strings': (fn) => {
      assert.deepEqual(fn('"hello world"'), ['"hello world"'])
    },
    'numbers': (fn) => {
      assert.deepEqual(fn('123'), ['123'])
      assert.deepEqual(fn('123.45'), ['123.45'])
    },
    'lists': (fn) => {
      assert.deepEqual(fn('(+ 1 2)'), ['(', '+', '1', '2', ')'])
      assert.deepEqual(fn('(+ 1 (- 4 5))'), ['(', '+', '1', '(', '-', '4', '5', ')', ')'])
    },
    'vectors': (fn) => {
      assert.deepEqual(fn('[1 2 3]'), ['[', '1', '2', '3', ']'])
    },
    'hashMap': (fn) => {
      assert.deepEqual(fn('{1 2}'), ['{', '1', '2', '}'])
    },
    'quoting': (fn) => {
      assert.deepEqual(fn("'1"), ["'", '1'])
    },
    'splice-unquote': (fn) => {
      assert.deepEqual(fn('~@5'), ['~@', '5'])
    },
    'quasiquote': (fn) => {
      assert.deepEqual(fn('`5'), ['`', '5'])
    },
    'unquote': (fn) => {
      assert.deepEqual(fn('~5'), ['~', '5'])
    },
    'deref': (fn) => {
      assert.deepEqual(fn('@a'), ['@', 'a'])
    },
    'with-meta': (fn) => {
      assert.deepEqual(fn('^{"a" 1} [1 2 3]'), ['^', '{', '"a"', '1', '}', '[', '1', '2', '3', ']'])
    },
    'comments': (fn) => {
      assert.deepEqual(fn('; this is a comment'), [])
    },
    'keyword': (fn) => {
      assert.deepEqual(fn(':hello'), [':hello'])
    },
    'true': (fn) => {
      assert.deepEqual(fn('true'), ['true'])
    },
    'false': (fn) => {
      assert.deepEqual(fn('true'), ['true'])
    },
    'nil': (fn) => {
      assert.deepEqual(fn('nil'), ['nil'])
    },
    'spaces and commas stripped': (fn) => {
      assert.deepEqual(fn('1, 2, 3'), ['1', '2', '3'])
    },

  },
})

ddoc.fn('read_next_token', {
  doc: 'Parses a source string into the first token and the rest of the string',
  shape: 'String -> String, String',
  args: [
    'Mal source code',
  ],
  returns: [
    'First token',
    'Rest of source code excluding first token',
  ],
  examples: {
    'base cases': (fn) => {
      assert.deepEqual(fn('123'), ['123', ''])
      assert.deepEqual(fn('(+ 12 35)'), ['(', '+ 12 35)'])
      assert.deepEqual(fn('"hello world"'), ['"hello world"', ''])
      assert.deepEqual(fn("'[1 2 3]"), ["'", '[1 2 3]'])
      assert.deepEqual(fn('2 3]'), ['2', ' 3]'])
    },
  },
})

export const read_next_token = function (str) {
  tokenizerRegexp.lastIndex = 0
  const match = tokenizerRegexp.exec(str)
  if (!match) {
    return [null, str]
  }
  return [match[1], str.slice(tokenizerRegexp.lastIndex)]
}

export const tokenizer = function (str, tokens) {
  const newTokens = tokens || []
  const [token, nextStr] = read_next_token(str)
  if (!token) {
    return tokens
  } else if (token.charAt(0) !== ';') {
    newTokens.push(token)
  }
  return tokenizer(nextStr, newTokens)
}

const expand_reader_macro = function (reader) {
  switch (reader.next()) {
    case `'`:
      return malList(malSymbol('quote'), read_form(reader))
    case '`':
      return malList(malSymbol('quasiquote'), read_form(reader))
    case '~':
      return malList(malSymbol('unquote'), read_form(reader))
    case '~@':
      return malList(malSymbol('splice-unquote'), read_form(reader))
    case '@':
      return malList(malSymbol('deref'), read_form(reader))
    case '^':
      const meta = read_form(reader)
      reader.next()
      return malList(malSymbol('with-meta'), read_form(reader), meta)
  }
}

const read_form = function (reader) {
  if (['(', '[', '{'].indexOf(reader.peek()) !== -1) {
    return read_list(reader)
  } else if ([`'`, '`', '~', '~@', '@', '^'].indexOf(reader.peek()) !== -1) {
    return expand_reader_macro(reader)
  }
  return read_atom(reader)
}

const read_list = function (reader) {
  const firstToken = reader.peek()

  const compundDataType = {
    '(': malList,
    '[': malVector,
    '{': malHashMap,
  }[firstToken]

  const expectedClosingChar = {
    '(': ')',
    '{': '}',
    '[': ']',
  }[firstToken]

  const forms = []
  while (reader.next()) {
    if (reader.peek() === expectedClosingChar) {
      return compundDataType(...forms)
    }
    forms.push(read_form(reader))
  }
  throw new Error(`expected '${expectedClosingChar}', got EOF`)
}

const read_atom = function (reader) {
  const token = reader.peek()
  if (/^true$/.test(token)) {
    return true
  } else if (/^false$/.test(token)) {
    return false
  } else if (/^nil$/.test(token)) {
    return malNil()
  } else if (/^:[a-zA-Z]+/.test(token)) {
    return malKeyword(token)
  } else if (/^[-+]?\d+$/.test(token)) {
    return parseInt(token, 10)
  } else if (/[-+]?[0-9]*\.[0-9]+/.test(token)) {
    return parseFloat(token)
  } else if (/"(?:\\.|[^\\"])*"/.test(token)) {
    return malString(token)
  } else if (/[\[\]\'{}()'`~^@]|[^\s\[\]{}('"`,;)]+/.test(token)) {
    return malSymbol(token)
  }

  throw new Error(`Token ${token} couldn\'t be parsed`)
}
export const doc = ddoc
