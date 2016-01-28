let _module
const funcs = []
// const clss = []
// const mths = []

export const module = (mod, doc) => _module = {mod, doc}
export const fn = (name, explanation) => funcs.push({name, explanation})
export const cls = () => {}
export const mth = () => {}

const _runTests = function (exampleName, example, func) {
  try {
    example(func)
    console.log(`  ${exampleName} OK`)
  } catch (e) {
    console.log(`  ${exampleName} -> Error`)
    console.log(`    expected: ${JSON.stringify(e.actual)}`)
    console.log(`    got: ${JSON.stringify(e.expected)}`)
  }
}

export const runExamples = function () {
  const mod = _module.mod
  funcs.forEach(function (func) {
    console.log(func.name)
    const examples = func.explanation.examples
    const _func = mod.exports[func.name]
    Object.keys(examples).forEach(function (exampleName) {
      _runTests(exampleName, examples[exampleName], _func)
    })
  })
}
