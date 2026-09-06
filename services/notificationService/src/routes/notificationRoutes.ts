import { Router } from 'express'
import { emailService } from '../services/emailService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticateMonolith } from '../middleware/authenticateMonolith.js'

const router = Router()

router.post(
  '/email',
  authenticateMonolith,
  asyncHandler(async (req, res) => {
    const { to, subject, body } = req.body

    const result = await emailService.sendEmail({ to, subject, body })

    res.json({ success: true, messageId: result.messageId })
  }),
)

export { router as notificationRoutes }
