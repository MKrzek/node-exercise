**How It Works (3 Parts):**

1. Queue (emailQueue.ts)
   Like a to-do list stored in Redis

You add jobs to it: "Send email to alice@example.com"

Jobs wait here until a worker picks them up

2. Worker (emailWorker.ts)
   A background process that constantly checks the queue

Sees a new job → Picks it up → Sends the email

Can run multiple workers in parallel (you set concurrency: 3 = 3 jobs at once)

3. Redis
   The database that stores the queue

Jobs survive even if your app restarts

Multiple workers can share the same queue

**Why This Setup?**

// Queue - adds jobs
await emailQueue.add('send-email', { recipient: 'alice@example.com' })

// Worker - processes jobs automatically
// (runs in background, no code needed in your API)

What happens:
API route calls emailQueue.add() → Job added to Redis

Worker (running separately) sees the job → Sends email

API responds instantly to user (doesn't wait for email to send!)

Key Benefits:
Fast API — Routes respond in milliseconds, not seconds

Reliable — If email fails, job retries automatically (you set attempts: 3)

Scalable — Add more workers if queue gets too long

Resilient — If your app crashes, jobs stay in Redis queue (not lost!)

Your Files:
emailQueue.ts — Defines the queue (where jobs go)

emailWorker.ts — Processes jobs (sends emails)

Redis — Stores the queue (already running in your Docker!)
