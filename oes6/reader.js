import {
  malHashMap,
  malList,
  malNil,
  malString,
  malSymbol,
  malVector,
  malKeyword
} from './types.js'
import * as doc from './doc.js'
import * as assert from 'assert'

doc.module(module, {
  doc: `
    Parses a source string into an AST.
    e.g.:

    123 -> 123

    (+ 1 2) -> List(Symbol(+), 1, 2)

    (+ 1 (+ 2 3)) -> List(Symbol(+), 1, List(Symbol(+), 2, 3))
  `,
})

doc.fn('read_str', {
  doc: 'Parses a source string into an AST.',
  shape: 'String -> Mal data type',
  args: [
    'Mal source code',
  ],
  returns: 'Mal AST',
  examples: {
    'atoms': (fn) => {
      assert.equals(fn('123'), 123)
      assert.equals(fn('123.45'), 123.45)
      assert.equals(fn('"hello world"'), 'hello world')
    },
    'compound data types': (fn) => {
      assert.equals(fn('(+ 1 2)'), malList(malSymbol('+'), 1, 2))
      assert.equals(fn('[1 2 3]'), malVector(1, 2, 3))
      assert.equals(fn('{"key" value}'), malHashMap('key', malSymbol('value')))
    },
    'empty string': (fn) => {
      assert.equals(fn(''), undefined)
    },
  },
})

export const read_str = function (str) {
  const tokens = tokenizer(str)
  if (!tokens.length) {
    return undefined
  }
  const reader = new Reader(tokens)
  return read_form(reader)
}

class Reader {
  constructor (tokens) {
    this.tokens = tokens
    this.index = 0
  }

  next () {
    const nextToken = this.peek()
    this.index ++
    return nextToken
  }

  peek () {
    return this.tokens[this.index]
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

doc.fn('tokenizer', {
  doc: 'Parses a source string into a list of tokens.',
  shape: 'String -> Array',
  args: [
    'Mal source code',
  ],
  returns: 'token list',
  examples: {
    'strings': (fn) => {
      assert.equals(fn('"hello world"'), ['hello world'])
    },
    'numbers': (fn) => {
      assert.equals(fn('123'), ['123'])
      assert.equals(fn('123.45'), ['123.45'])
    },
    'lists': (fn) => {
      assert.equals(fn('(+ 1 2)'), ['(', '123', ')'])
      assert.equals(fn('(+ 1 (- 4 5))'), ['(', '123', '(', '-', '4', '5', ')', ')'])
    },
    'vectors': (fn) => {
      assert.equals(fn('[1 2 3]'), ['[', '1', '2', '3', ']'])
    },
    'hashMap': (fn) => {
      assert.equals(fn('{1 2}'), ['{', '1', '2', '}'])
    },
    'quoting': (fn) => {
      assert.equals(fn("'1", ["'", '1']))
    },
    'splice-unquote': (fn) => {
      assert.equals(fn('~@5', ['~@', '5']))
    },
    'quasiquote': (fn) => {
      assert.equals(fn('`5', ['`', '5']))
    },
    'unquote': (fn) => {
      assert.equals(fn('~5', ['~', '5']))
    },
    'deref': (fn) => {
      assert.equals(fn('@a', ['@', 'a']))
    },
    'with-meta': (fn) => {
      assert.equals(fn('^{"a" 1} [1 2 3]', ['^', '{', '"a"', '1', '}', '[', '1', '2', '3', ']']))
    },
    'comments': (fn) => {
      assert.equals(fn('; this is a comment'), ['; this is a comment'])
    },
    'keyword': (fn) => {
      assert.equals(fn(':hello'), [':hello'])
    },
    'true': (fn) => {
      assert.equals(fn('true'), ['true'])
    },
    'false': (fn) => {
      assert.equals(fn('true'), ['true'])
    },
    'nil': (fn) => {
      assert.equals(fn('nil'), ['nil'])
    },
    'spaces and commas stripped': (fn) => {
      assert.equals(fn('1, 2, 3'), ['1', '2', '3'])
    },

  },
})

const tokenizer = function (str) {
  const tokens = []
  while (true) {
    const match = tokenizerRegexp.exec(str)
    if (!match) {
      return tokens
    } else if (match[1].charAt(0) === ';') {
      continue
    }
    tokens.push(match[1])
  }
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
