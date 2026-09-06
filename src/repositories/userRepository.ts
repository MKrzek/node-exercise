import { prisma } from '../lib/prisma.js'

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  async create(email: string, passwordHash: string) {
    return prisma.user.create({
      data: { email, passwordHash },
    })
  },
}
