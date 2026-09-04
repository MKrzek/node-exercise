**REDIS** and **BullMQ**

_BullMQ is a Redis-based job queue for Node.js._ You use it when you want to do work after the HTTP request finishes, like sending email, generating reports, processing files, or retrying failed jobs in the background.

BullMQ uses Redis as a durable queue store; caching uses Redis as a fast temporary read store. Same database, different job.

We don't write to cache on updates — we just delete it. This is intentional and simpler.

Why delete instead of updating the cache?
Two reasons:

1. Simpler logic
   Updating the cache on writes would require:

Fetching the old cached value

Parsing it

Recomputing the aggregation with the new data

Serializing and storing it back

**MENTAL MODEL**

READ (GET /stats/goals)
↓
Cache hit? → return cached data
↓
Cache miss? → query DB → compute stats → write to cache → return data

WRITE (create/update goal or session)
↓
Mutation in DB succeeds
↓
Delete cache key
↓
Next read will repopulate cache fresh
