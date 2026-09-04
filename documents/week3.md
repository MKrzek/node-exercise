Node event loop — the core idea
Node runs on a single thread. When async work finishes (a timer fires, a file read completes, a promise resolves), the callback goes into a queue. The event loop processes those queues in a fixed order every "tick".

The order that matters most in practice:

1. synchronous code ← runs first, always
2. process.nextTick() ← runs before anything else async
3. Promise microtasks ← runs after nextTick, before I/O
4. setTimeout / setInterval ← timers phase
5. setImmediate ← check phase, after I/O

Hmm, Promise still ran before nextTick even in raw Node. That's actually a known behaviour change — Node 11+ changed the microtask order so Promise microtasks now run between each nextTick callback, not strictly after the whole nextTick queue.

| Rule                                                        | Still true?   |
| ----------------------------------------------------------- | ------------- |
| Sync code runs before anything async                        | ✅ always     |
| nextTick runs before I/O callbacks                          | ✅ always     |
| setImmediate beats setTimeout inside I/O                    | ✅ always     |
| setTimeout vs setImmediate outside I/O is non-deterministic | ✅ always     |
| Nested nextTick drains before Promises                      | ✅ still true |

The senior-level insight is: never rely on setTimeout(..., 0) for ordering; use Promise.resolve(), queueMicrotask(), or process.nextTick() if you need something to run "after current sync but before I/O".

process.nextTick
Imagine you're a chef (Node) working through a to-do list (your code). You finish a task and before you pick up the next item from the list, you check a sticky note on the fridge — that's process.nextTick.

```javascript
console.log('task 1')

process.nextTick(() => console.log('sticky note'))

console.log('task 2')
```

task 1
task 2
sticky note ← checked after current work, before anything else

process.nextTick says: "run this function as soon as the current operation finishes, before doing anything else async." It doesn't go to a timer, it doesn't wait for a file — it just cuts to the front of the queue

In real code you'd use it when writing a function that needs to call a callback asynchronously, even if the result is already available:

```javascript
function getValue(cb: (val: number) => void) {
  process.nextTick(() => cb(42)) // always async, never sync
}
```

Without nextTick, sometimes the callback fires synchronously and sometimes asynchronously depending on code path — which is a very subtle bug. nextTick makes it consistently async.

**I/O**
I/O stands for Input/Output — anything that involves talking to something outside Node's single thread:

Reading or writing a file (fs.readFile).

Making a network request (HTTP call, talking to Postgres).

Reading from stdin (keyboard input).

These operations take time and Node can't just freeze and wait for them (that would block everything). Instead Node says: "go do that, and when it's done, put the callback in the queue and I'll get to it."

```javascript
import { readFile } from 'node:fs'

console.log('before read')

readFile('./myfile.txt', 'utf8', (err, data) => {
  console.log('file contents:', data) // runs later, when OS is done reading
})

console.log('after read')
```

before read
after read
file contents: ... ← ran later, after OS finished reading the file

Node didn't freeze waiting for the file. It registered the callback and moved on. When the OS said "done!", Node put that callback into the I/O phase of the event loop and ran it.

**How they relate**
The event loop processes work in this order every cycle:

your sync code
→ nextTick queue (sticky notes, run immediately after sync)
→ Promise queue (resolved promises)
→ I/O callbacks (file reads, DB responses, network calls)
→ setImmediate (things queued after I/O)
→ setTimeout (things queued by timers)

So nextTick always runs before I/O callbacks because it's checked before Node even gets to the I/O phase. That's why it's useful for "do this right now, before any file or network response comes back."

**EVent Loop**
Node.js is single-threaded — it can only do one thing at a time. But it can handle thousands of concurrent requests. The event loop is how that's possible

Think of Node as a single chef in a kitchen. The chef can only cook one dish at a time, but they're very good at delegating:

Need to boil water? Put the pot on and go do something else.

Need to read a file? Ask the OS to do it and go do something else.

When the water boils or the file is ready, the chef gets a notification and deals with it.

The event loop is the chef's system for checking those notifications and deciding what to do next.

**The loop itself**
It's literally a loop that runs forever while your Node process is alive:

┌─────────────────────────────────┐
│ your sync code │ ← runs first
└──────────────┬──────────────────┘
│
┌──────────────▼──────────────────┐
│ nextTick queue │ ← sticky notes
└──────────────┬──────────────────┘
│
┌──────────────▼──────────────────┐
│ Promise microtasks │ ← resolved promises
└──────────────┬──────────────────┘
│
┌──────────────▼──────────────────┐
│ timers phase │ ← setTimeout, setInterval
└──────────────┬──────────────────┘
│
┌──────────────▼──────────────────┐
│ I/O callbacks │ ← file reads, DB responses
└──────────────┬──────────────────┘
│
┌──────────────▼──────────────────┐
│ check phase │ ← setImmediate
└──────────────┬──────────────────┘
│
(loop again)

Each time around the loop is called a tick

**What actually handles I/O**
Here's the key question: if Node is single-threaded, who is actually doing the file reading or the network call while Node moves on?

**The answer is libuv — a C **library that Node is built on. It manages a thread pool (usually 4 threads by default) that handles I/O operations in the background.

Your Node code libuv thread pool
────────────── ─────────────────
readFile('x.txt', cb) →→→→ [thread]: reading file...
[thread]: done! here's the data
←←← puts callback in I/O queue
event loop picks it up
and runs cb(data)

So Node itself stays single-threaded, but the heavy lifting (actual disk reads, DNS lookups, crypto operations) happens in libuv's thread pool behind the scenes

**Why this matters for your Express app**
Every incoming HTTP request to your Express app is an I/O event. Node registers a callback for "when a request arrives", and the event loop picks it up and runs your route handler.

If your route handler does something synchronous and slow (like a massive loop or heavy computation), it blocks the event loop — no other requests can be handled while that's running:

```javascript
// ❌ blocks the event loop — all other requests wait
app.get('/bad', (req, res) => {
  let total = 0
  for (let i = 0; i < 10_000_000_000; i++) total += i // blocks for seconds
  res.json({ total })
})

// ✅ non-blocking — hands off to libuv, event loop stays free
app.get('/good', async (req, res) => {
  const result = await prisma.learningGoal.findMany() // libuv handles DB I/O
  res.json({ data: result })
})
```

This is why async/await matters in Node — it's not just style, it's how you keep the event loop free to handle other requests.

# The three things to remember

Node is single-threaded but non-blocking because it delegates I/O to libuv.

The event loop is the system that keeps checking "is anything ready?" and running the right callbacks in the right order.

Never block the event loop with synchronous heavy work — that's the cardinal rule of Node performance
