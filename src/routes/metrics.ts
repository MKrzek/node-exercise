import { Router } from 'express'
import { getMetrics } from '../lib/metrics.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ data: getMetrics() })
})

export default router
