import { Queue } from 'bullmq'

// Parse REDIS_URL or use default
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Parse the URL into host/port
const url = new URL(redisUrl)

export const emailQueue = new Queue('email', {
  connection: {
    host: url.hostname,
    port: parseInt(url.port, 10),
    password: url.password || undefined,
    username: url.username || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
})
