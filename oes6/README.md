In order to run mal as a self hosted language there are 2 libraries that need to be installed:

https://github.com/nodejs/node-gyp

https://github.com/node-ffi/node-ffi

These 2 libraries enable `import { readline } from './node_readline'` to run on `core.js`
