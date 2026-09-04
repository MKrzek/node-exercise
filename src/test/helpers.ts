import supertest from 'supertest'
import { prisma } from '../lib/prisma.js'
import { randomUUID } from 'node:crypto'
import app from '../app.js'

const request = supertest(app)

export async function resetDb() {
  await prisma.session.deleteMany()
  await prisma.learningGoal.deleteMany()
  await prisma.user.deleteMany()
}

export async function getAuthToken(): Promise<string> {
  const res = await request.post('/auth/register').send({
    email: `test-${randomUUID()}@example.com`,
    password: 'password123',
  })
  return res.body.data.token
}
