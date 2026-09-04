import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ status: '200', timestamp: new Date().toISOString() })
  }),
)

export default router
