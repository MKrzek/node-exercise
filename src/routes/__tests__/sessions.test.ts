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
  return res
}

async function createSession(goalId: string, overrides = {}) {
  const res = await request
    .post(`/goals/${goalId}/sessions`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      durationMinutes: 25,
      notes: 'First pomodoro',
      ...overrides,
    })
  return res
}

// ─── POST /goals/:id/sessions ───────────────────────────────────────────────

describe('POST /goals/:id/sessions', () => {
  it('creates a session for a goal and returns 201', async () => {
    const createdGoal = await createGoal()
    const goalId = createdGoal.body.data.id

    const res = await createSession(goalId)

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      goalId,
      durationMinutes: 25,
      notes: 'First pomodoro',
    })
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.createdAt).toBeDefined()
  })

  it('moves goal status from planned to in_progress on first session', async () => {
    const createdGoal = await createGoal()
    const goalId = createdGoal.body.data.id

    await createSession(goalId)

    const getRes = await request
      .get(`/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(getRes.status).toBe(200)
    expect(getRes.body.data.status).toBe('in_progress')
  })

  it('does not change status if already in_progress or done', async () => {
    const createdGoal = await createGoal()
    const goalId = createdGoal.body.data.id

    await request
      .patch(`/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    await createSession(goalId)

    const getRes = await request
      .get(`/goals/${goalId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(getRes.body.data.status).toBe('in_progress')
  })

  it('returns 404 when goal does not exist', async () => {
    const res = await request
      .post('/goals/00000000-0000-0000-0000-000000000000/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ durationMinutes: 20 })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 422 when durationMinutes is invalid', async () => {
    const createdGoal = await createGoal()
    const goalId = createdGoal.body.data.id

    const res = await request
      .post(`/goals/${goalId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ durationMinutes: -5 })

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
    expect(res.body.details.durationMinutes).toBeDefined()
  })
})

// ─── GET /goals/:id/sessions ────────────────────────────────────────────────

describe('GET /goals/:id/sessions', () => {
  it('returns empty array when no sessions exist', async () => {
    const createdGoal = await createGoal()
    const goalId = createdGoal.body.data.id

    const res = await request
      .get(`/goals/${goalId}/sessions`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.count).toBe(0)
  })

  it('returns all sessions for a goal', async () => {
    const createdGoal = await createGoal()
    const goalId = createdGoal.body.data.id

    await createSession(goalId, { durationMinutes: 30, notes: 'Morning' })
    await createSession(goalId, { durationMinutes: 45, notes: 'Evening' })

    const res = await request
      .get(`/goals/${goalId}/sessions`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.count).toBe(2)
    expect(res.body.data[0].goalId).toBe(goalId)
  })

  it('returns 404 for unknown goal id', async () => {
    const res = await request
      .get('/goals/00000000-0000-0000-0000-000000000000/sessions')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 422 for non-uuid goal id', async () => {
    const res = await request
      .get('/goals/not-a-uuid/sessions')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})
