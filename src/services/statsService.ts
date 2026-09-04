import { statsRepository } from '../repositories/statsRepository.js'
import { redis } from '../lib/redis.js'
import { logger } from '../lib/logger.js'

const GOALS_STATS_CACHE_KEY = 'stats:goals'
const GOALS_STATS_TTL_SECONDS = 60

export const statsService = {
  async getGoalStats() {
    const cached = await redis.get(GOALS_STATS_CACHE_KEY)

    if (cached) {
      logger.info({ cacheKey: GOALS_STATS_CACHE_KEY }, 'cache hit')
      return JSON.parse(cached)
    }

    logger.info({ cacheKey: GOALS_STATS_CACHE_KEY }, 'cache miss')

    const [countsByStatus, minutesPerGoal] = await Promise.all([
      statsRepository.getGoalCountsByStatus(),
      statsRepository.getTotalMinutesPerGoal(),
    ])

    const stats = {
      byStatus: countsByStatus.map((row) => ({
        status: row.status,
        count: row._count.id,
      })),
      sessionMinutesPerGoal: minutesPerGoal.map((row) => ({
        goalId: row.goalId,
        totalMinutes: row._sum.durationMinutes ?? 0,
      })),
    }

    await redis.set(GOALS_STATS_CACHE_KEY, JSON.stringify(stats), {
      EX: GOALS_STATS_TTL_SECONDS,
    })

    return stats
  },
}
