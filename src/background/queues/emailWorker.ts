import { Worker, Job } from 'bullmq'
import { delay } from '../../utils/delay.js'
import { withTimeout } from '../../utils/withTimeout.js'

interface EmailJobData {
  recipient: string
  subject: string
  correlationId?: string
}

// Parse REDIS_URL or use default
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Parse the URL into host/port
const url = new URL(redisUrl)

async function sendEmail(job: Job<EmailJobData>, signal?: AbortSignal): Promise<void> {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      queue: 'email',
      jobId: job.id,
      attempt: job.attemptsMade + 1,
      message: 'processing email',
      recipient: job.data.recipient,
      correlationId: job.data.correlationId,
    }),
  )

  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  if (Math.random() < 0.3) {
    throw new Error('SMTP timeout')
  }

  await delay(200, signal)

  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      queue: 'email',
      jobId: job.id,
      message: 'email sent',
      recipient: job.data.recipient,
      correlationId: job.data.correlationId,
    }),
  )
}

async function processEmail(job: Job<EmailJobData>): Promise<void> {
  await withTimeout(async (signal) => {
    await sendEmail(job, signal)
  }, 1000)
}

export const emailWorker = new Worker<EmailJobData>('email', processEmail, {
  connection: {
    host: url.hostname,
    port: parseInt(url.port, 10),
    password: url.password || undefined,
    username: url.username || undefined,
  },
  concurrency: 3,
})

emailWorker.on('failed', (job, err) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      queue: 'email',
      jobId: job?.id,
      message: 'job failed',
      error: err.message,
      attemptsMade: job?.attemptsMade,
      correlationId: job?.data?.correlationId,
    }),
  )
})

emailWorker.on('completed', (job) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      queue: 'email',
      jobId: job.id,
      message: 'job completed',
      correlationId: job.data.correlationId,
    }),
  )
})
