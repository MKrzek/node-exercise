// emailJob.test.js
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

import { runEmailJob } from '../emailJob.js'

describe('runEmailJob', () => {
  beforeEach(() => {
    mockJobLogger.info.mockClear()
    mockJobLogger.warn.mockClear()
    mockJobLogger.error.mockClear()
  })

  it('completes without throwing', async () => {
    await expect(runEmailJob()).resolves.not.toThrow()
  })

  it('logs a finished message', async () => {
    await runEmailJob()
    expect(mockJobLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        sent: expect.any(Number),
        failed: expect.any(Number),
      }),
      'finished',
    )
  })
})
