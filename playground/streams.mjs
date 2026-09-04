import { createReadStream, createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)

const stream = createReadStream(__filename, { encoding: 'utf8', highWaterMark: 64 })
// highWaterMark = chunk size in bytes (64 bytes here so you can see chunks)

let chunkCount = 0

stream.on('data', (chunk) => {
  chunkCount++
  console.log(`chunk ${chunkCount}: ${chunk.length} chars`)
})

stream.on('end', () => {
  console.log(`done — total chunks: ${chunkCount}`)
})

stream.on('error', (err) => {
  console.error('stream error:', err)
})

// second example: copying a file using streams
// pipe connects a Readable to a Writable automatically, handling chunk-by-chunk transfer:

const read = createReadStream('./playground/streams.mjs')
const write = createWriteStream('./playground/streams-copy.mjs')

read.pipe(write)

write.on('finish', () => console.log('file copied via stream!'))
