# PROCESS / THREAD / WORKER

# Process
A process is a running program. When you run node app.js, the OS creates a process. It gets its own:

1. isolated memory space

2. its own V8 engine instance

3. its own event loop

4. its own PID (process ID)

Two processes cannot share memory directly. They're completely walled off from each other.

node app.js → Process A (pid: 1234)
                 ├── memory
                 ├── V8 engine
                 └── event loop

# Thread
A thread lives inside a process. It's the actual unit of execution — the thing that runs code line by line.
1. Every process has at least one thread.
2. Threads inside the same process share memory
3. But each thread has its own call stack (its own place in the code it's executing)
4. The OS schedules threads onto CPU cores

Process A (pid: 1234)
  ├── shared memory
  ├── Thread 1 (main) → running your event loop
  ├── Thread 2        → running a worker
  └── Thread 3        → running another worker

Event loop
The event loop is not a thread — it's a pattern running on the main thread. It's a loop that continuously checks: "is there any I/O ready? any callbacks to run? any timers fired?" and executes them one at a time

Main thread runs this loop forever:
  → check timers
  → check I/O callbacks
  → check setImmediate
  → repeat

Worker
"Worker" is just a friendly name — it describes the role, not a new concept:

| Term                   | In worker_threads              | In cluster                   |
| ---------------------- | ------------------------------ | ---------------------------- |
| Worker                 | A thread (inside same process) | A process (separate, forked) |
| What it is technically | Thread                         | Process                      |

Your machine (4 cores)
│
├── Core 1
├── Core 2
├── Core 3
└── Core 4
      ↑ OS schedules processes/threads onto these

Your Node app (cluster, 2 workers):
│
├── Primary Process (pid: 100)
│     └── Main thread → event loop
│
├── Worker Process (pid: 101)        ← cluster worker = process
│     └── Main thread → event loop
│
└── Worker Process (pid: 102)        ← cluster worker = process
      └── Main thread → event loop
        └── Worker thread 1          ← worker_threads worker = thread
        └── Worker thread 2          ← worker_threads worker = thread


# One-line summary of each
Process = a running program with its own memory and event loop

Thread = a unit of execution living inside a process

Event loop = a pattern running on the main thread, handling async work

Worker = a label for a thread (worker_threads) or process (cluster) doing background work

Every thread gets its own call stack — that's what makes them independent.

Main thread                    Worker thread
───────────────────────────    ───────────────────────────
Call stack:                    Call stack:
┌─────────────────────────┐    ┌─────────────────────────┐
│ worker.on('message')    │    │ heavyWork()             │
├─────────────────────────┤    ├─────────────────────────┤
│ http.createServer cb    │    │ (worker entry point)    │
└─────────────────────────┘    └─────────────────────────┘

doing its own thing ↑               doing its own thing ↑
completely independent              completely independent

They never interfere with each other.

Why this matters
This is exactly why the main thread doesn't block. The heavy loop builds up its own call stack on its own thread:

one of that touches the main thread's call stack. The main thread's stack is free to process HTTP requests, run timers, handle callbacks.

The one shared thing
Threads inside the same process share heap memory (objects, buffers) — but each has its own stack. This is why workerData has to be copied when passed to a worker — it crosses a thread boundary, so it gets its own copy in the worker's memory rather than sharing a reference.

So yes — one call stack per thread, always. That isolation is the whole reason threads can work independently without stepping on each other.

# CLUSTERS

Yes — and even more isolated than threads. Each cluster worker is a full process, so it gets everything of its own:

Primary Process (pid: 100)        Worker Process (pid: 101)        Worker Process (pid: 102)
──────────────────────────        ─────────────────────────        ─────────────────────────
Own heap memory                   Own heap memory                  Own heap memory
Own V8 engine                     Own V8 engine                    Own V8 engine
Own event loop                    Own event loop                   Own event loop
Own call stack                    Own call stack                   Own call stack

Completely walled off. One process crashing doesn't take the others down.
​

# Compared to worker_threads

worker_threads (one process):         cluster (multiple processes):
──────────────────────────────        ──────────────────────────────
Process A                             Process A    Process B    Process C
 ├── shared heap ◄── threads          │            │            │
 │   can see each other's data        own heap     own heap     own heap
 ├── Main thread stack                own stack    own stack    own stack
 ├── Worker thread 1 stack            own V8       own V8       own V8
 └── Worker thread 2 stack


With worker_threads, threads share heap memory (so you could share data via SharedArrayBuffer). With cluster, processes share nothing — completely separate.