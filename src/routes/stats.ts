import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { statsService } from '../services/statsService.js'
import { emailQueue } from '../background/queues/emailQueue.js'

const router = Router()

router.get(
  '/goals',
  asyncHandler(async (_req, res) => {
    const stats = await statsService.getGoalStats()
    res.json({ data: stats })
  }),
)

export default router
