// const goals: LearningGoal[] = []

// export const learningGoalRepository = {
//   findAll(status?: GoalStatus): LearningGoal[] {
//     if (status) return goals.filter((g) => g.status === status)
//     return [...goals]
//   },

//   findById(id: string): LearningGoal | undefined {
//     return goals.find((g) => g.id === id)
//   },

//   create(goal: LearningGoal): LearningGoal {
//     goals.push(goal)
//     return goal
//   },

//   update(id: string, data: Partial<LearningGoal>): LearningGoal | undefined {
//     const index = goals.findIndex((g) => g.id === id)
//     if (index === -1) return undefined
//     if (!goals[index]) {
//       return undefined
//     }
//     const updated = {
//       ...goals[index],
//       ...data,
//       id,
//       updatedAt: new Date().toISOString(),
//     }
//     goals[index] = updated
//     return updated
//   },

//   // useful for tests
//   clear(): void {
//     goals.length = 0
//   },
// }

import { prisma } from '../lib/prisma.js'
import type { LearningGoal } from '../types/prisma.js'
import type { GoalQuery, GoalStatus } from '../validation/learningGoalSchemas.js'
import { handlePrismaError } from '../errors/prismaErrorHandler.js'

export const learningGoalRepository = {
  async findAll({
    status,
    sort,
    order,
    page,
    pageSize,
    userId,
  }: GoalQuery & { userId: string }) {
    const where = {
      userId,
      ...(status ? { status } : {}),
    }
    const skip = (page - 1) * pageSize
    const take = pageSize

    const [data, total] = await prisma.$transaction([
      prisma.learningGoal.findMany({
        where,
        orderBy: { [sort]: order } as Record<string, 'asc' | 'desc'>,
        skip,
        take,
      }),
      prisma.learningGoal.count({ where }),
    ])

    return { data, total }
  },

  async findById(id: string): Promise<LearningGoal | null> {
    try {
      return await prisma.learningGoal.findUnique({ where: { id } })
    } catch (err) {
      handlePrismaError(err)
    }
  },

  async create(data: {
    userId: string
    title: string
    description: string
    status?: GoalStatus
  }): Promise<LearningGoal> {
    try {
      return await prisma.learningGoal.create({ data })
    } catch (err) {
      handlePrismaError(err)
    }
  },

  async update(
    id: string,
    data: Partial<{ title: string; description: string; status: GoalStatus }>,
  ): Promise<LearningGoal | null> {
    try {
      return await prisma.learningGoal.update({ where: { id }, data })
    } catch (err) {
      handlePrismaError(err)
    }
  },

  async clear(): Promise<void> {
    await prisma.learningGoal.deleteMany()
  },
}
