import { readFile } from 'node:fs'
import { fileURLToPath } from 'node:url'

console.log('1 - sync start')

setTimeout(() => console.log('2 - setTimeout'), 0)
setImmediate(() => console.log('3 - setImmediate'))

Promise.resolve().then(() => console.log('4 - Promise microtask'))

process.nextTick(() => console.log('5 - nextTick'))

console.log('6 - sync end')

process.nextTick(() => {
  console.log('nextTick 1')
  process.nextTick(() => console.log('nextTick 2 - nested'))
})

Promise.resolve().then(() => console.log('Promise microtask'))

const __filename = fileURLToPath(import.meta.url)

readFile(__filename, () => {
  setTimeout(() => console.log('setTimeout inside I/O'), 0)
  setImmediate(() => console.log('setImmediate inside I/O'))
})
