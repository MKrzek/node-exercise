// cleanupJob.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockJobLogger } = vi.hoisted(() => ({
  mockJobLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../../lib/logger.js', () => ({
  logger: {
    child: vi.fn(() => mockJobLogger),
  },
}))

vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    session: {
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
    },
  },
}))

import { runCleanupJob, resetLock, setRunning } from '../cleanupJob.js'
import { prisma } from '../../../lib/prisma.js'

describe('runCleanupJob', () => {
  beforeEach(() => {
    resetLock()
    vi.mocked(prisma.session.deleteMany).mockClear()
    mockJobLogger.info.mockClear()
    mockJobLogger.warn.mockClear()
    mockJobLogger.error.mockClear()
  })

  it('calls deleteMany with a cutoff date', async () => {
    await runCleanupJob()
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    })
  })

  it('logs deleted count on success', async () => {
    await runCleanupJob()
    expect(mockJobLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ deletedSessions: 5 }),
      'finished',
    )
  })

  it('logs error if deleteMany throws', async () => {
    vi.mocked(prisma.session.deleteMany).mockRejectedValueOnce(
      new Error('DB connection lost'),
    )
    await runCleanupJob()
    expect(mockJobLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'DB connection lost' }),
      'failed',
    )
  })

  it('skips if already running', async () => {
    setRunning(true)
    await runCleanupJob()
    expect(mockJobLogger.warn).toHaveBeenCalledWith(
      'skipped — previous run still in progress',
    )
    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(0)
  })
})
