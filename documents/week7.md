# V8 ENGINE VS CALL_STACK

V8 is the whole engine
V8 is Google's JavaScript engine — it's the thing that reads, compiles, and executes your JS code. It contains several components:

V8 Engine
├── Parser → reads your JS, turns it into an AST
├── Compiler → turns AST into machine code (JIT)
├── Call Stack → tracks where execution is right now
├── Heap → stores objects, arrays, functions in memory
└── Garbage Collector → cleans up unused memory

The call stack is just one part
The call stack is V8's mechanism for tracking what function is currently running and what called it. Every time you call a function, V8 pushes it onto the stack. When it returns, V8 pops it off.

The heap is the other key part
While the stack tracks execution position, the heap stores data:

Call stack Heap
────────────────────── ──────────────────────
"where am I in the code" "where is my data"

                          function calls objects {}
                          return addresses arrays []

primitive values strings
closures

Primitives (number, boolean) live on the stack. Objects, arrays, functions live on the heap.

**Why each thread needs its own V8**

# When you create a worker_threads worker, Node spins up a new V8 instance for it — because each thread needs its own:

1. call stack (its own execution position)
2. compiler (to run its own code)
3. garbage collector (to manage its own memory)

But they share the heap of the parent process — which is why passing data between threads requires copying (you can't safely share a heap object across concurrent threads without risking race conditions).

One-line summary
V8 = the whole JS runtime (parser + compiler + memory + execution)

Call stack = one piece of V8 that tracks where execution currently is

# Actually, the event loop is not part of V8 — this is one of the most common misconceptions in Node.js.

# What V8 does

V8 handles purely executing JavaScript. It has no concept of timers, HTTP, file system, or async. It just runs code and manages memory.

V8:
├── Parse JS
├── Compile JS → machine code
├── Call stack (execute functions)
└── Heap (store data)

# That's it. V8 has no idea what setTimeout or fs.readFile is at the language engine level.

# Where the event loop actually lives

The event loop is part of libuv — a C library that Node.js is built on. **libuv handles all async I/O, timers, and the event loop itself.**

Node.js = V8 + libuv + Node core APIs

┌─────────────────────────────────────┐
│ Your JS code │
├─────────────────────────────────────┤
│ V8 engine (executes JS) │
├─────────────────────────────────────┤
│ libuv (event loop + async I/O) │
│ ├── timers (setTimeout) │
│ ├── file system │
│ ├── network │
│ └── thread pool │
└─────────────────────────────────────┘
OS (Linux / macOS / Windows)

# # How they work together

# They're a team — neither works without the other:

1. You call setTimeout(() => console.log('hi'), 1000)

2. V8 executes that line, then hands the timer off to libuv

3. libuv tracks the timer in the event loop, JS execution continues

4. 1 second later, libuv says "timer ready" → pushes callback to the queue

5. V8 picks it up and executes console.log('hi')

# V8 calls → libuv manages async → libuv notifies V8 → V8 executes callback

Simple mental model
V8 = a calculator. Brilliant at maths, has no concept of time or the outside world.

libuv = a PA. Manages your schedule, waits for things, taps V8 on the shoulder when something is ready.

Node.js = both working together.

# So when people say "the Node event loop" they're really talking about libuv's event loop, not V8

the queue and the call stack are different things. This is the crucial detail of how async actually works.

# Queue vs Call stack

Call stack — where code is currently executing, right now, synchronously

Callback queue — a waiting area for callbacks that are ready to run but not yet executing

Call stack Callback queue
────────────────────── ──────────────────────
active execution waiting room

│ currentFunction() │ [ timerCallback, clickHandler, ... ]
│ main() │
└──────────────────-┘

# The event loop's actual job

The event loop is just a loop that does one thing — it checks:

"Is the call stack empty? If yes, take the next callback from the queue and push it onto the stack."

```javascript
while (true) {
  if (callStack.isEmpty() && queue.hasItems()) {
    callStack.push(queue.shift()) // now V8 executes it
  }
}
```

**
This is why JS is non-blocking — libuv waits for things async, queues the callbacks, and the event loop only hands them to V8 when the stack is clear**

# The full flow for setTimeout

1. V8 executes setTimeout(fn, 1000)
   ↓
2. libuv takes the timer, JS moves on
   ↓
3. 1 second passes, libuv says "ready"
   ↓
4. fn pushed to → CALLBACK QUEUE (waiting room)
   ↓
5. event loop checks: is call stack empty?
   ↓
6. YES → moves fn from queue → onto CALL STACK
   ↓
7. V8 executes fn

# Why the queue matters

The callback never jumps straight to the call stack — it always goes queue first. This is why setTimeout(fn, 0) doesn't execute immediately — fn still has to wait in the queue until the call stack is clear.

```javascript
console.log('1') // call stack → executes now
setTimeout(() => {
  console.log('2') // queue → waits for stack to clear
}, 0)
console.log('3') // call stack → executes now

// Output: 1, 3, 2
```

# The full picture

        Your JS code
             ↓

┌────────────────────────┐
│ Call Stack (V8) │ ← only one thing runs at a time here
└────────────┬───────────┘
↑ event loop moves callbacks here when stack is empty
┌────────────────────────┐
│ Callback Queue │ ← ready callbacks wait here
└────────────────────────┘
↑ libuv pushes here when async work completes
┌────────────────────────┐
│ libuv │ ← timers, I/O, network running async
└────────────────────────┘
