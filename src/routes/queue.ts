import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { emailQueue } from '../background/queues/emailQueue.js'
import { delay } from '../utils/delay.js'

const router = Router()

router.post(
  '/email',
  asyncHandler(async (req, res) => {
    if (req.abortSignal?.aborted) {
      return
    }

    await delay(3000, req.abortSignal)

    if (req.abortSignal?.aborted) {
      return
    }

    const job = await emailQueue.add('send-welcome', {
      recipient: req.body.recipient ?? 'test@example.com',
      subject: req.body.subject ?? 'Welcome!',
      correlationId: req.correlationId,
    })

    if (req.abortSignal?.aborted || res.headersSent) {
      return
    }

    res.json({ data: { jobId: job.id, status: 'queued' } })
  }),
)

router.get(
  '/email',
  asyncHandler(async (req, res) => {
    if (req.abortSignal?.aborted) {
      return
    }

    const [waiting, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ])

    if (req.abortSignal?.aborted || res.headersSent) {
      return
    }

    res.json({ data: { waiting, active, completed, failed } })
  }),
)

export default router
