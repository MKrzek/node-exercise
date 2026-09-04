import { prisma } from '../lib/prisma.js'

export const statsRepository = {
  async getGoalCountsByStatus() {
    return prisma.learningGoal.groupBy({
      by: ['status'],
      _count: { id: true },
    })
  },

  async getTotalMinutesPerGoal() {
    return prisma.session.groupBy({
      by: ['goalId'],
      _sum: { durationMinutes: true },
    })
  },
}
