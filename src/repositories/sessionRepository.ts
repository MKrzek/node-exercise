// src/repositories/sessionRepository.js
import { prisma } from '../lib/prisma.js'
import { handlePrismaError } from '../errors/prismaErrorHandler.js'

export const sessionRepository = {
  async create(data: {
    id: string
    goalId: string
    durationMinutes: number
    notes?: string
  }) {
    try {
      return await prisma.session.create({ data })
    } catch (err) {
      handlePrismaError(err)
    }
  },

  async findByGoalId(goalId: string) {
    try {
      return await prisma.session.findMany({
        where: { goalId },
        orderBy: { date: 'desc' },
      })
    } catch (err) {
      handlePrismaError(err)
    }
  },

  async clear(): Promise<void> {
    await prisma.session.deleteMany()
  },
}
