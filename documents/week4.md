# STREAMS

# What streams are

_A stream is a way to handle data piece by piece instead of all at once._

Imagine reading a book. You could:

Wait for someone to read the entire book, memorise it, then tell you everything **(buffering — loads all into memory).**

Or have someone read it to you one page at a time, while you process each page as it arrives **(streaming)**

```javascript
// ❌ buffered — reads entire file into memory first
import { readFileSync } from 'node:fs'
const data = readFileSync('./hugefile.csv') // waits, holds everything in RAM
process(data)

// ✅ streamed — reads chunk by chunk
import { createReadStream } from 'node:fs'
const stream = createReadStream('./hugefile.csv')
stream.on('data', (chunk) => process(chunk)) // handles each piece as it arrives
```

This matters when files are large (logs, CSV imports, video) — buffering a 2GB file crashes your server; streaming it uses almost no memory.

# The four types of streams in Node

| Type      | What it does          | Example                                |
| --------- | --------------------- | -------------------------------------- |
| Readable  | You read data from it | fs.createReadStream, HTTP request body |
| Writable  | You write data to it  | fs.createWriteStream, HTTP response    |
| Duplex    | Both read and write   | TCP socket                             |
| Transform | Read, modify, write   | gzip compression, encryption           |

# Backpressure (the important concept)

What happens if your Readable produces data faster than your Writable can consume it?

Readable: ████████████████ (fast producer)
Writable: ████ (slow consumer)

**Without backpressure, data piles up in memory — your process crashes.**
​
**pipe** handles this automatically: when the Writable's internal buffer is full, it signals the Readable to pause, then resumes it when the buffer drains.

```javascript
const read = createReadStream('./playground/streams.mjs')
const write = createWriteStream('/dev/null') // discard output

read.on('data', (chunk) => {
  const ok = write.write(chunk)
  if (!ok) {
    console.log('backpressure! pausing read')
    read.pause() // stop reading until write buffer drains
  }
})

write.on('drain', () => {
  console.log('drain event — resuming read')
  read.resume()
})

read.on('end', () => console.log('done'))
```

# The key insight

Without streams, reading even a 100MB file would load all 100MB into RAM before you could do anything. With streams, you only ever hold one chunk (64 bytes here, typically 16–64KB in real code) in memory at a time.
​

**This is exactly how your Express app handles request bodies — the HTTP request arrives as a stream, and Express reads it chunk by chunk before handing it to your route handler.**

**Where streams appear in your Express/Prisma app (without you realising)**

| Thing you use          | Stream underneath                             |
| ---------------------- | --------------------------------------------- |
| req.body parsing       | HTTP Readable stream                          |
| res.json(data)         | HTTP Writable stream                          |
| Postgres query results | Can be streamed with Prisma's $queryRawUnsafe |
| File uploads           | Readable stream from multipart                |
