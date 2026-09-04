import supertest from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { getAuthToken, resetDb } from '../../test/helpers.js'

const request = supertest(app)

let token: string

beforeEach(async () => {
  await resetDb()
  token = await getAuthToken()
})

// ─── helpers ────────────────────────────────────────────────────────────────

async function createGoal(overrides = {}) {
  const res = await request
    .post('/goals')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Learn Node internals',
      description: 'Event loop, streams, clustering',
      ...overrides,
    })
  return res.body.data
}

async function createSession(goalId: string, durationMinutes: number) {
  await request
    .post(`/goals/${goalId}/sessions`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      durationMinutes,
      notes: 'Test session',
    })
}

// ─── GET /stats/goals ────────────────────────────────────────────────────────

describe('GET /stats/goals', () => {
  it('returns empty stats when no data exists', async () => {
    const res = await request
      .get('/stats/goals')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.byStatus).toEqual([])
    expect(res.body.data.sessionMinutesPerGoal).toEqual([])
  })

  it('returns correct counts by status', async () => {
    await createGoal({ title: 'Planned 1' })
    await createGoal({ title: 'Planned 2' })
    const inProgress = await createGoal({ title: 'In progress' })
    await request
      .patch(`/goals/${inProgress.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    const res = await request
      .get('/stats/goals')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    const planned = res.body.data.byStatus.find(
      (s: { status: string }) => s.status === 'planned',
    )
    const inProgressStat = res.body.data.byStatus.find(
      (s: { status: string }) => s.status === 'in_progress',
    )

    expect(planned.count).toBe(2)
    expect(inProgressStat.count).toBe(1)
  })

  it('returns total session minutes per goal', async () => {
    const goal = await createGoal()
    await createSession(goal.id, 30)
    await createSession(goal.id, 45)

    const res = await request
      .get('/stats/goals')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    const goalStat = res.body.data.sessionMinutesPerGoal.find(
      (s: { goalId: string }) => s.goalId === goal.id,
    )

    expect(goalStat.totalMinutes).toBe(75)
  })

  it('returns 0 minutes for goals with no sessions', async () => {
    await createGoal()

    const res = await request
      .get('/stats/goals')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.sessionMinutesPerGoal).toEqual([])
  })
})
