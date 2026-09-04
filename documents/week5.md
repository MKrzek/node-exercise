# worker_threads and cluster — how Node actually uses multiple cores

Node is single-threaded. That's fine for I/O (file reads, DB queries, HTTP calls) because libuv handles those in the background. But what about CPU-heavy work — like encrypting a large file, resizing an image, or running a complex calculation?

```javascript
// This blocks the event loop for everyone
app.get('/slow', (req, res) => {
  let total = 0
  for (let i = 0; i < 5_000_000_000; i++) total += i // ~5 seconds of blocking
  res.json({ total })
})
```

While that loop runs, no other request can be handled. The event loop is frozen.

Node gives you two tools to fix this: ** worker_threads and cluster**.

# worker_threads — multiple threads, one process

worker_threads lets you spin up extra threads inside the same Node process. Each worker runs in its own thread, so CPU-heavy work moves off the main thread without blocking the event loop.

**Main thread (event loop) → handles HTTP requests
Worker thread 1 → does heavy computation
Worker thread 2 → does heavy computation**

Workers communicate with the main thread via message passing (no shared memory by default).

# cluster — multiple processes, one port

cluster forks your entire Node process into multiple copies, each on its own core. A master process distributes incoming connections across workers.

Master process → distributes connections
Worker process 1 → full Node app, handles some requests
Worker process 2 → full Node app, handles other requests
Worker process 3 → full Node app, handles other requests
Worker process 4 → full Node app, handles other requests

# Key difference

|                 | worker_threads                    | cluster                              |
| --------------- | --------------------------------- | ------------------------------------ |
| Use for         | CPU-heavy tasks                   | Scaling request handling             |
| What it creates | Threads (lightweight)             | Full processes (heavier)             |
| Shared memory   | Possible via SharedArrayBuffer    | No — separate processes              |
| Real-world use  | Image processing, crypto, parsing | Running 4 workers on a 4-core server |

# CPUs and cores

A modern server has multiple cores — think of each core as an independent worker that can execute code simultaneously. A 4-core CPU can genuinely run 4 things at the same time (not just switching between them fast).

# The problem with plain Node

Node is single-threaded, so it only ever uses one core, no matter how many cores the server has:

4-core server running plain Node:

Core 1: ████████████████ ← Node is here, handling all requests
Core 2: ░░░░░░░░░░░░░░░░ ← idle, wasted
Core 3: ░░░░░░░░░░░░░░░░ ← idle, wasted
Core 4: ░░░░░░░░░░░░░░░░ ← idle, wasted

You're paying for a 4-core server but only using 25% of it.

# What cluster does

cluster.fork() creates a copy of your entire Node app as a separate process. Each process runs on its own core:

4-core server running Node with cluster:

Core 1: ████████████████ ← Worker 1 (full Express app)
Core 2: ████████████████ ← Worker 2 (full Express app)
Core 3: ████████████████ ← Worker 3 (full Express app)
Core 4: ████████████████ ← Worker 4 (full Express app)

Incoming HTTP requests get distributed across all 4 workers, so your app can handle 4x the concurrent load

Without cluster:
1000 requests arrive simultaneously
→ 1 process handles them all, one event loop tick at a time
→ requests queue up, latency increases

With cluster (4 workers):
1000 requests arrive simultaneously
→ ~250 go to Worker 1
→ ~250 go to Worker 2
→ ~250 go to Worker 3
→ ~250 go to Worker 4
→ all handled in parallel, latency stays low

Not exactly — a worker is a process or thread, and a core is physical hardware. They're related but not the same thing.

# The real-world version

In production you rarely write cluster code yourself — tools like PM2 do it for you:

```javascript

pm2 start app.js -i max  # -i max = one worker per CPU core
```

# The distinction

A core is a physical piece of your CPU that can execute code. It's hardware — you can't create more cores in software.

A worker (in cluster) is a process — a running copy of your Node app. It's software.

How they relate
When you fork 4 cluster workers on a 4-core machine, the operating system decides which core runs which process. It tries to spread them evenly, so typically Worker 1 runs on Core 1, Worker 2 on Core 2, etc. — but the OS can move processes between cores freely.

Your Node cluster workers OS assigns to cores
────────────────────────── ──────────────────
Worker 1 (process 1234) →→→ Core 1
Worker 2 (process 1235) →→→ Core 2
Worker 3 (process 1236) →→→ Core 3
Worker 4 (process 1237) →→→ Core 4

# What happens if you create more workers than cores?

It still works — the OS just time-slices between processes on each core:

6 workers on 4 cores:

Core 1: Worker 1 → Worker 5 → Worker 1 → Worker 5 ...
Core 2: Worker 2 → Worker 6 → Worker 2 → Worker 6 ...
Core 3: Worker 3 → Worker 3 → Worker 3 ...
Core 4: Worker 4 → Worker 4 → Worker 4 ...

But you get diminishing returns — creating 16 workers on a 4-core machine won't make things 4x faster again, because now cores are switching between processes rather than running them fully.

# Simple mental model

Core = a lane on a motorway (physical, fixed number).

Worker/process = a car (software, you can create as many as you like).

More cars than lanes = traffic, not more speed.

That's why the convention is one worker per core — it maximises throughput without context-switching overhead.

# What actually happens when you call new Worker()

```javascript
# const worker = new Worker(new URL(import.meta.url), {
  workerData: { limit: 1_000_000_000 },
})

```

# Node creates a new OS thread in the background

1. That thread gets its own V8 engine instance — its own JS runtime, its own memory

2. It runs the same file (import.meta.url) but with isMainThread === false

3. workerData is copied (not shared) into the worker's memory

4. The worker starts executing — the heavyWork() loop runs on that thread

5. Meanwhile, the main thread's event loop carries on completely unaware

# The key: the file runs twice

This is the part that confuses most people. When you do new Worker(new URL(import.meta.url), ...) you're telling Node: "run this same file again, but in a new thread"

```javascript
if (isMainThread) {
  // ← only the FIRST run hits this (your main thread)
  new Worker(...)

} else {
  // ← only the SECOND run hits this (inside the worker thread)
  heavyWork()
  parentPort.postMessage(result)
}
```

# How the result comes back — message passing

# The worker doesn't return a value like a function. It posts a message back:

Worker thread Main thread
───────────────────────────── ──────────────────────────────
heavyWork() runs... event loop keeps ticking
(handles other requests etc.)
result ready → postMessage() → worker.on('message') fires
you handle the result here

parentPort.postMessage(result) sends data back across the thread boundary. The main thread receives it asynchronously via the message event — just like receiving a response from an API call.

# Why the main thread stays free

The heavy loop runs on a different thread entirely. The main thread never calls heavyWork() — it just:

1. Spawns the worker (new Worker(...)) — fast

2. Registers the message listener — fast

3. Continues its event loop as normal

The loop is physically executing on a different CPU thread. Your main thread genuinely has nothing to do with it until the message arrives.

You (main thread): "Here's a huge spreadsheet to calculate — ping me when done"
→ hand it off → go back to your own work
Colleague (worker): _crunches numbers for 5 seconds_
→ "Done, here's the result"
You (main thread): receive the message, handle the result

# WORKER_THREADS

Threads are software, cores are hardware. The OS decides which core runs which thread

# What Node actually creates

When you call new Worker(), Node (via libuv) asks the OS to create a new thread. That thread is then scheduled onto a core by the OS — you have no direct control over which one.

Your Node process (1 process, multiple threads):

Main thread → OS assigns to → Core 1
Worker thread 1 → OS assigns to → Core 2
Worker thread 2 → OS assigns to → Core 3
Worker thread 3 → OS assigns to → Core 1 ← OS may share cores

# The important nuance

If you spawn more threads than cores, the OS time-slices them — same motorway/cars analogy as before. But for CPU-bound work, spawning roughly one worker per core is optimal because:

Each thread gets its own core with minimal context switching

More workers than cores = threads compete for the same core, adding overhead with no gain

So what's the real guarantee?
You're not guaranteed a dedicated core. What you are guaranteed is that the heavy work runs off the main thread — so your event loop stays free regardless of what the OS does with cores. That's the actual win.
