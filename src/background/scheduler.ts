import cron from 'node-cron'
import { runEmailJob } from './jobs/emailJob.js'
import { runCleanupJob } from './jobs/cleanupJob.js'
import { logger } from '../lib/logger.js'

export function startScheduler(): void {
  logger.info('scheduler started')

  const emailTask = cron.schedule('*/30 * * * * *', async () => {
    await runEmailJob()
  })

  const cleanupTask = cron.schedule('* * * * *', async () => {
    await runCleanupJob()
  })

  // graceful shutdown — stop cron tasks before process exits
  const shutdown = () => {
    logger.info('scheduler shutting down...')
    emailTask.stop()
    cleanupTask.stop()
    logger.info('scheduler stopped')
    process.exit(0)
  }

  process.on('SIGTERM', shutdown) // PM2, Docker, cloud platforms send this
  process.on('SIGINT', shutdown) // ctrl+c in terminal sends this
}
