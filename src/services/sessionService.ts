import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { learningGoalRepository } from '../repositories/learningGoalRepository.js'
import { AppError } from '../errors/AppError.js'
import type { CreateSessionInput } from '../validation/sessionSchemas.js'
import { sessionRepository } from '../repositories/sessionRepository.js'
import { redis } from '../lib/redis.js'

const GOALS_STATS_CACHE_KEY = 'stats:goals'

export const sessionService = {
  async create(goalId: string, input: CreateSessionInput) {
    // ensure goal exists first
    const goal = await learningGoalRepository.findById(goalId)
    if (!goal) throw new AppError(`Goal ${goalId} not found`, 404, 'NOT_FOUND')

    const nextStatus = goal.status === 'planned' ? 'in_progress' : goal.status

    // transaction: create session + update goal status atomically
    const [session] = await prisma.$transaction([
      prisma.session.create({
        data: {
          id: randomUUID(),
          goalId,
          durationMinutes: input.durationMinutes,
          notes: input.notes,
        },
      }),
      // auto-move goal to in_progress when first session is logged
      prisma.learningGoal.update({
        where: { id: goalId },
        data: {
          status: nextStatus,
        },
      }),
    ])

    await redis.del(GOALS_STATS_CACHE_KEY)

    return session
  },

  async getByGoalId(goalId: string) {
    const goal = await learningGoalRepository.findById(goalId)
    if (!goal) throw new AppError(`Goal ${goalId} not found`, 404, 'NOT_FOUND')
    return sessionRepository.findByGoalId(goalId)
  },
}
