_// BAD: Loading entire file into memory_
const data = fs.readFileSync('huge-file.csv') // 💥 2GB file = 2GB RAM
const lines = data.split('\n')

_// GOOD: Process chunk by chunk_
const stream = fs.createReadStream('huge-file.csv') // 💪 64KB chunks
stream.on('data', (chunk) => {
// Process small piece, free memory, repeat
})

Key Benefits:

Memory efficient - Process GB files with MBs of RAM

Time efficient - Start processing before download/read completes

Composable - Chain operations like Unix pipes (cat | grep | wc)

Backpressure aware - Fast producers don't overwhelm slow consumers

**# The Four Stream Types**

┌─────────────┐
│ Readable │ → Emits data (fs.readFile, HTTP request, database cursor)
└─────────────┘

┌─────────────┐
│ Writable │ ← Consumes data (fs.writeFile, HTTP response, database insert)
└─────────────┘

┌─────────────┐
│ Transform │ → Modify data mid-stream (gzip, parse CSV, encrypt)
└─────────────┘

┌─────────────┐
│ Duplex │ ↔ Both readable AND writable (socket, TCP connection)
└─────────────┘

**_Core Concepts_**

1. Events:

'data' - Chunk received

'end' - No more data

'error' - Something broke

'close' - Underlying resource closed

'finish' - All data flushed (writable only)

/```javascript
/ Old school
readable.on('data', chunk => writable.write(chunk))
readable.on('end', () => writable.end())

// Modern
readable.pipe(writable)

// Best (handles errors)
readable.pipe(writable).pipe(transform)

```

```

```javascript
import { pipeline } from 'node:stream/promises'

await pipeline(readable, transform, writable) // Auto-cleanup, proper error handling
```

4. Backpressure:

```javascript
// Writable.write() returns false when buffer is full
if (!writable.write(chunk)) {
  readable.pause() // Stop reading
  writable.once('drain', () => readable.resume()) // Resume when ready
```

What you practiced
Using createReadStream + csv-parse to stream a file.

Mapping CSV values to your Prisma schema (completed → done).

Inserting records one-by-one with prisma.learningGoal.create().

Handling errors per-row without failing the whole import.
