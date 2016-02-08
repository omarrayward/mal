import {
  malHashMap,
  malList,
  malNil,
  malString,
  malSymbol,
  malVector,
  malKeyword
} from './types.js'

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

export const read_str = function (str) {
  const tokens = tokenizer(str)
  if (!tokens.length) {
    return undefined
  }
  const reader = new Reader(tokens)
  return read_form(reader)
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
    '{': malHashMap
  }[firstToken]

  const expectedClosingChar = {
    '(': ')',
    '{': '}',
    '[': ']'
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
