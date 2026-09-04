PRISMA/MIGRATIONS/TRANSACTIONS/

For prisma schema
@map keeps column names snake_case in the DB while staying camelCase in TypeScript — standard convention.

@@map keeps table names snake_case.

@updatedAt is handled automatically by Prisma on every update

Validate config/env file - This is a senior pattern — crash at startup with a clear message if required config is missing, rather than failing mysteriously at runtime.

1. Schema.prisma is your single source of truth
   This file describes your data model in Prisma's own language:
   Think of it like a TypeScript interface, but for your database.
   Prisma reads this and:
   -Generates the SQL to create your tables.
   -Generates TypeScript types you can import.
   -Generates the query client with methods matching your models.

2. Migrations — keeping DB in sync with schema
   When you change schema.prisma, your actual database doesn't automatically change. Migrations are the bridge.
   You change schema.prisma
   ↓
   npx prisma migrate dev --name my_change
   ↓
   Prisma diffs your schema against the current DB
   ↓
   Generates a .sql file describing what changed
   ↓
   Runs that SQL against your database
   ↓
   DB is now in sync with your schema

   The migration files live in prisma/migrations/ and should be committed to git — they're a history of every change your database has ever had. In production you run prisma migrate deploy instead of migrate dev.

3. Prisma Client — the query layer
   After running prisma generate, Prisma generates a client in node_modules/.prisma/client that's fully tailored to your schema. This is what you import and use:
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();

   Prisma knows this model exists and what fields it has
   await prisma.learningGoal.findMany();
   await prisma.learningGoal.create({ data: { ... } });
   await prisma.learningGoal.update({ where: { id }, data: { ... } });
   await prisma.learningGoal.delete({ where: { id } });

4. Why prisma.config.ts exists (Prisma 7 change)

   In Prisma 7 they moved it out into prisma.config.ts so config and schema are separate concerns.

5. Why @prisma/adapter-pg exists (Prisma 7 change)

   Also new in Prisma 7 — the client no longer bundles a database driver. You install the driver separately and pass it in: lib/prisma.ts

   prisma.config.ts → used by Prisma CLI (migrations, introspection)
   src/lib/prisma.ts — tells PrismaClient how to connect at runtime
   src/lib/prisma.ts → used by your app at runtime (queries) (driver is here)

   They both point at the same database, but they're separate concerns.

6. Why the singleton pattern in src/lib/prisma.ts

   ***

   const globalForPrisma = globalThis as unknown as {
   prisma: PrismaClient | undefined;
   };
   export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
   if (process.env.NODE_ENV !== 'production') {
   globalForPrisma.prisma = prisma;}

   ***

   Every time tsx watch detects a file change, it re-runs your modules. Without this pattern, each reload would create a new PrismaClient instance, opening new database connections. Postgres has a connection limit (default 100). You'd exhaust it quickly in development.

The globalThis trick stores the single instance outside the module system so it survives hot reloads.

THE FULL SETUP
.env
└── DATABASE_URL="postgresql://..."
│
├── prisma.config.ts ← Prisma CLI reads this for migrations
│
└── src/lib/prisma.ts ← Your app reads this at runtime
│
↓
PrismaClient (singleton)
│
↓
Your repositories
(learningGoalRepository.ts)
│
↓
Your services
(learningGoalService.ts)
│
↓
Your routes
(learningGoals.ts)

USEFULL COMMANDS

| Command                         | What it does                                                      |
| ------------------------------- | ----------------------------------------------------------------- |
| npx prisma migrate dev --name x | Create + apply a migration in development                         |
| npx prisma generate             | Regenerate the TypeScript client after schema changes             |
| npx prisma studio               | Open browser UI to inspect/edit DB data                           |
| npx prisma migrate deploy       | Apply pending migrations in production                            |
| npx prisma db push              | Sync schema to DB without creating a migration (prototyping only) |

adapter connects the client and db at runtime

Your app code
│
▼
PrismaClient ← knows your schema, generates type-safe queries
│
▼
Adapter (PrismaPg) ← translates Prisma's query format to SQL
│
▼
pg (node-postgres) ← the actual driver that talks to Postgres over TCP
│
▼
PostgreSQL database

Why this matters in practice
The adapter is also where connection pooling lives. PrismaPg uses pg's Pool under the hood — it maintains a pool of open connections to Postgres rather than opening a new connection for every query:

Query 1 → borrows connection from pool → runs query → returns connection
Query 2 → borrows connection from pool → runs query → returns connection

Without pooling, every request would open and close a TCP connection to Postgres — expensive and slow. The pool keeps connections warm and ready.

adapter = runtime bridge + connection pool.

6. TO CHECK TYPE RUN: npm run typecheck

7. Connection pooling
   Opening a database connection is expensive — it involves a TCP handshake, authentication, and memory allocation on both sides. It takes ~20–100ms.

Without pooling, every request does this:
Request comes in
↓
Open new TCP connection to Postgres ← expensive, ~50ms
↓
Authenticate
↓
Run query ← fast, ~1ms
↓
Close connection ← wasted all that setup

App starts
↓
Pool opens 10 connections and keeps them warm
↓
Request comes in
↓
Borrow a connection from pool ← ~0ms, already open
↓
Run query
↓
Return connection to pool ← ready for next request

A pool is just a bucket of pre-opened, reusable connections. Default pool size in pg is 10 — meaning up to 10 queries can run simultaneously before others queue up.

10. pg — what it actually is
    pg (node-postgres) is a Node.js library — not the database itself. It's the driver that knows how to speak PostgreSQL's wire protocol over TCP.

Your Node app
│ (uses)
▼
pg library ← npm package, lives in node_modules
│ (speaks PostgreSQL wire protocol over TCP)
▼
PostgreSQL process ← the actual database engine

PostgreSQL, the database, and pg, the npm package, are two completely separate things with similar names, which is confusing. Think of it like:

PostgreSQL = the database server (like MySQL, SQLite)

pg = the Node.js client that talks to postgresSQL (like a phone that calls the server)

Your Mac
├── Node process (tsx watch src/server.ts)
│ ├── Express app
│ ├── PrismaClient
│ └── pg Pool ──────────────────────────────┐
│ │ TCP connection
└── Docker container │ localhost:5432
└── PostgreSQL process ←──────────────────┘
└── learning_tracker database
└── learning_goals table

PrismaClient
│ uses
▼
PrismaPg adapter
│ uses
▼
pg Pool (10 connections, pre-opened)
│ TCP to localhost:5432
▼
Docker container → PostgreSQL process → learning_tracker DB

TRANSACTIONS:

1. A transaction groups multiple DB operations so they either all succeed or all fail together. Without transactions, a partial failure leaves your data in an inconsistent state.

for example:
// ❌ no transaction — if step 2 fails, goal exists but audit log is missing
await prisma.learningGoal.create({ data: goalData });
await prisma.auditLog.create({ data: logData }); // crashes here

// ✅ transaction — both succeed or neither does
await prisma.$transaction([
prisma.learningGoal.create({ data: goalData }),
prisma.auditLog.create({ data: logData }),
]);

DOTENV \_ SERVER.TS
import 'dotenv/config' runs and loads .env, populating process.env.
Then config/env.ts runs and reads already-populated process.env.
Zod validation passes.
So the root cause was import evaluation ORDER, not the presence/absence of dotenv.

**PRISMA CLIENT**

Prisma generates a session property on PrismaClient whose methods match this model (findMany, create, deleteMany, etc.). The mapping is always:

Model Session → prisma.session

Model LearningGoal → prisma.learningGoal
What this schema gives you
Session rows link to LearningGoal via goalId with a foreign key and onDelete: Cascade. Deleting a goal deletes its sessions automatically.

@@index([goalId]) makes findMany({ where: { goalId } }) efficient.

LearningGoal.sessions lets you later do:

```javascript
await prisma.learningGoal.findUnique({
  where: { id },
  include: { sessions: true },
})
```
