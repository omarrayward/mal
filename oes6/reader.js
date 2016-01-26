import {MalFalse,
        MalHashMap,
        MalFloat,
        MalInteger,
        MalKeyword,
        MalList,
        MalNil,
        MalString,
        MalSymbol,
        MalTrue,
        MalVector} from './types.js'

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
    return new MalNil()
  }
  const reader = new Reader(tokens)
  return read_form(reader)
}

const expand_reader_macro = function (reader) {
  switch (reader.next()) {
    case `'`:
      return new MalList(new MalSymbol('quote'), read_form(reader))
    case '`':
      return new MalList(new MalSymbol('quasiquote'), read_form(reader))
    case '~':
      return new MalList(new MalSymbol('unquote'), read_form(reader))
    case '~@':
      return new MalList(new MalSymbol('splice-unquote'), read_form(reader))
    case '@':
      return new MalList(new MalSymbol('deref'), read_form(reader))
    case '^':
      const meta = read_form(reader)
      reader.next()
      return new MalList(new MalSymbol('with-meta'), read_form(reader), meta)
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

  const CompundDataType = {
    '(': MalList,
    '[': MalVector,
    '{': MalHashMap
  }[firstToken]

  const expectedClosingChar = {
    '(': ')',
    '{': '}',
    '[': ']'
  }[firstToken]

  const forms = []
  while (reader.next()) {
    if (reader.peek() === expectedClosingChar) {
      return new CompundDataType(...forms)
    }
    forms.push(read_form(reader))
  }
  throw new Error(`expected '${expectedClosingChar}', got EOF`)
}

const malTypeForRegex = new Map([
  [/true/, MalTrue],
  [/false/, MalFalse],
  [/nil/, MalNil],
  [/^:[a-zA-Z]+/, MalKeyword],
  [/^[-+]?\d+$/, MalInteger],
  [/[-+]?[0-9]*\.[0-9]+/, MalFloat],
  [/"(?:\\.|[^\\"])*"/, MalString],
  [/[\[\]\'{}()'`~^@]|[^\s\[\]{}('"`,;)]+/, MalSymbol]
])

const read_atom = function (reader) {
  const token = reader.peek()
  for (let regex of malTypeForRegex.keys()) {
    if (regex.test(token)) {
      const MalType = malTypeForRegex.get(regex)
      return new MalType(token)
    }
  }

  throw new Error(`Token ${token} couldn\'t be parsed`)
}
