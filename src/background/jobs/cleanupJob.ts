import { prisma } from '../../lib/prisma.js'

import { logger } from '../../lib/logger.js'

const jobLogger = logger.child({ job: 'cleanup-job' })

// lock flag — prevents concurrent runs
let isRunning = false

export async function runCleanupJob(): Promise<void> {
  if (isRunning) {
    jobLogger.warn('skipped — previous run still in progress')
    return
  }

  isRunning = true
  const start = Date.now()
  jobLogger.info('started')

  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)

    const deleted = await prisma.session.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    jobLogger.info(
      {
        deletedSessions: deleted.count,
        cutoffDate: cutoff.toISOString(),
        durationMs: Date.now() - start,
      },
      'finished',
    )
  } catch (err) {
    jobLogger.error(
      {
        error: err instanceof Error ? err.message : 'unknown',
        durationMs: Date.now() - start,
      },
      'failed',
    )
  } finally {
    isRunning = false // always release the lock
  }
}

export function resetLock(): void {
  isRunning = false
}

export function setRunning(value: boolean): void {
  isRunning = value
}
