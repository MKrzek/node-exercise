import { Router } from 'express'
import { readFileSync } from 'node:fs'

const router = Router()

const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
)

const startTime = Date.now()

router.get('/', (_req, res) => {
  const uptimeMs = Date.now() - startTime
  const mem = process.memoryUsage()

  res.json({
    status: 'ok',
    version,
    uptime: {
      ms: uptimeMs,
      human: formatUptime(uptimeMs),
    },
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  })
})

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export default router
