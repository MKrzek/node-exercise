import { learningGoalRepository } from '../repositories/learningGoalRepository.js'
import type {
  CreateGoalInput,
  GoalQuery,
  UpdateGoalInput,
} from '../validation/learningGoalSchemas.js'
import { AppError } from '../errors/AppError.js'
import type { LearningGoal } from '../types/prisma.js'
import { redis } from '../lib/redis.js'

const GOALS_STATS_CACHE_KEY = 'stats:goals'

export const learningGoalService = {
  async getAll(query: GoalQuery & { userId: string }) {
    return learningGoalRepository.findAll(query)
  },

  async getById(id: string): Promise<LearningGoal> {
    const goal = await learningGoalRepository.findById(id)
    if (!goal) throw new AppError(`Goal ${id} not found`, 404, 'NOT_FOUND')
    return goal
  },

  async create(input: CreateGoalInput & { userId: string }): Promise<LearningGoal> {
    const goal = await learningGoalRepository.create({
      userId: input.userId,
      title: input.title,
      description: input.description,
      status: input.status ?? 'planned',
    })

    await redis.del(GOALS_STATS_CACHE_KEY)

    return goal
  },

  async update(id: string, input: UpdateGoalInput): Promise<LearningGoal> {
    const existing = await learningGoalRepository.findById(id)
    if (!existing) throw new AppError(`Goal ${id} not found`, 404, 'NOT_FOUND')

    const updated = await learningGoalRepository.update(id, input)
    if (!updated) throw new AppError(`Goal ${id} not found`, 404, 'NOT_FOUND')

    await redis.del(GOALS_STATS_CACHE_KEY)

    return updated
  },
}
