// const log = (level: 'INFO' | 'ERROR' | 'WARN', message: string, meta?: object) => {
//   console.log(
//     JSON.stringify({
//       timestamp: new Date().toISOString(),
//       level,
//       job: 'email-job',
//       message,
//       ...meta,
//     }),
//   )
// }

import { logger } from '../../lib/logger.js'

const jobLogger = logger.child({ job: 'email-job' })
// lock flag — prevents concurrent runs
let isRunning = false

// Simulates sending an email — in real life this would be nodemailer/SendGrid
async function sendEmail(recipient: string): Promise<void> {
  const start = Date.now()
  jobLogger.info('started')
  // simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // simulate occasional failure
  if (Math.random() < 0.2) throw new Error('SMTP connection timeout')

  jobLogger.info({ recipient }, 'email sent')
}

export async function runEmailJob(): Promise<void> {
  const start = Date.now()
  jobLogger.info('started')

  const pendingEmails = ['alice@example.com', 'bob@example.com', 'carol@example.com']

  let sent = 0
  let failed = 0
  if (isRunning) {
    jobLogger.warn('skipped — previous run still in progress')
    return
  }

  isRunning = true

  for (const recipient of pendingEmails) {
    try {
      await sendEmail(recipient)
      sent++
    } catch (err) {
      failed++
      jobLogger.error(
        {
          recipient,
          error: err instanceof Error ? err.message : 'unknown',
        },
        'failed to send email',
      )
    } finally {
      isRunning = false // always release the lock
    }
  }

  jobLogger.info(
    {
      sent,
      failed,
      durationMs: Date.now() - start,
    },
    'finished',
  )
}
