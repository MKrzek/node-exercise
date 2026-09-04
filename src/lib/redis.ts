import { createClient } from 'redis'
import { env } from '../config/env.js'
import { logger } from './logger.js'

export const redis = createClient({
  url: env.redisUrl ?? 'redis://127.0.0.1:6379',
})

redis.on('error', (err) => {
  logger.error({ error: err.message }, 'redis client error')
})

let connected = false

export async function ensureRedisConnected() {
  if (!connected) {
    await redis.connect()
    connected = true
  }
}
