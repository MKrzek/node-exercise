import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'
import { learningGoalRepository } from '../repositories/learningGoalRepository.js'
import { AppError } from '../errors/AppError.js'
import type { CreateGoalInput, UpdateGoalInput, GoalQuery } from '../validation/learningGoalSchemas.js'

const GOALS_STATS_CACHE_KEY = 'stats:goals'

export const learningGoalService = {
  async getAll(query: GoalQuery & { userId: string }) {
    const { userId, status, search, page = 1, limit = 20 } = query

    const where: any = { userId }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.learningGoal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.learningGoal.count({ where }),
    ])

    return { data, total }
  },

  async getById(id: string, userId: string) {
    const goal = await learningGoalRepository.findById(id)
    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404, 'NOT_FOUND')
    }
    return goal
  },

  async create(input: CreateGoalInput & { userId: string }) {
    const goal = await learningGoalRepository.create({
      userId: input.userId,
      title: input.title,
      description: input.description,
      status: input.status ?? 'planned',
    })

    await redis.del(GOALS_STATS_CACHE_KEY)

    return goal
  },

  async update(id: string, input: UpdateGoalInput, userId: string) {
    const existing = await learningGoalRepository.findById(id)
    if (!existing || existing.userId !== userId) {
      throw new AppError('Goal not found', 404, 'NOT_FOUND')
    }

    const updated = await learningGoalRepository.update(id, input)
    if (!updated) throw new AppError(`Goal ${id} not found`, 404, 'NOT_FOUND')

    await redis.del(GOALS_STATS_CACHE_KEY)

    return updated
  },
}
