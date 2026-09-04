import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { createClient } from 'redis'
import { logger } from '../lib/logger.js'

const router = Router()

router.get('/', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = {}
  let allOk = true

  // check DB
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch (err) {
    logger.error({ err }, 'readiness check: database failed')
    checks.database = 'error'
    allOk = false
  }

  // check Redis
  try {
    const redis = createClient({ socket: { host: '127.0.0.1', port: 6379 } })
    await redis.connect()
    await redis.ping()
    await redis.disconnect()
    checks.redis = 'ok'
  } catch (err) {
    logger.error({ err }, 'readiness check: redis failed')
    checks.redis = 'error'
    allOk = false
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  })
})

export default router
