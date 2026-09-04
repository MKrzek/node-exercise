# SCHEDULER - CRON

# In-process schedulers vs external queues

# In-process scheduler (node-cron):

- Runs inside your Node process

- Simple — no extra infrastructure

- Dies if your process dies

- Good for: scheduled maintenance tasks, cleanup jobs, simple recurring work

Your Node process
├── Express (handles requests)
└── node-cron (runs jobs on a schedule)

# External queue (Bull, BullMQ — later topic):

- Runs separately from your Node process

- Backed by Redis — survives process restarts

- Supports retries, priorities, concurrency

- Good for: critical jobs (emails, payments), high volume, distributed systems

Your Node process → adds jobs to → Redis queue → worker process picks up and runs

# Why logging matters for background jobs

HTTP requests have a natural audit trail — you can check logs for POST /register 200 45ms. Background jobs run silently with no request to trace. If something goes wrong you have no idea:

Did the cleanup job run last night?

Did it fail halfway through?

How many records did it delete?

How long did it take?

Without logging, background jobs are a black box.

# Scheduler started before the server — good, jobs are registered as soon as the app boots.

# Job locking

PROBLEM:
Cleanup job starts at 00:00:00 → takes 90 seconds
Cron fires again at 00:01:00 → starts ANOTHER cleanup job
Now two cleanup jobs run simultaneously → deleting the same records twice

# What BullMQ is and why you need it

node-cron runs jobs in-process — if your server restarts, any queued work is lost. **BullMQ solves this by persisting jobs in Redis:**
node-cron: BullMQ:
────────────────────────── ──────────────────────────
job exists in memory only job persisted in Redis
server restarts → job lost server restarts → job survives
no retries automatic retries
no job history. full job history
single process only multiple workers, multiple servers

Queue → where you add jobs (producer)
Worker → picks up and processes jobs (consumer)
QueueEvents → lets you listen to job lifecycle events

Your Express route Redis Worker
────────────────── ────── ──────────────────
queue.add('send-email') →→→ [job stored] →→→ worker picks it up
processes it
marks done/failed

# COMMANDS

docker stop redis
docker start redis

--> POST /stats/queue/email ← HTTP request came in
<-- POST /queue/email 200 3ms ← responded instantly (job just queued, not processed yet)

...then separately, the worker picks it up...

processing email → alice@example.com ← worker started the job
email sent → alice@example.com ← job succeeded
job completed ← BullMQ marked it done in Redis
