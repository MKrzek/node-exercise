import supertest from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { resetDb } from '../../test/helpers.js'
import { getAuthToken } from '../../test/helpers.js'

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

// ─── POST /goals ─────────────────────────────────────────────────────────────

describe('POST /goals', () => {
  it('creates a goal and returns 201', async () => {
    const res = await createGoal()

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      title: 'Learn Node internals',
      description: 'Event loop, streams, clustering',
      status: 'planned',
    })
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.createdAt).toBeDefined()
  })

  it('returns 422 when title is missing', async () => {
    const res = await createGoal({ title: undefined })

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
    expect(res.body.details.title).toBeDefined()
  })

  it('returns 422 when status is invalid', async () => {
    const res = await createGoal({ status: 'invalid_status' })

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
    expect(res.body.details.status).toBeDefined()
  })

  it('returns 422 when description is missing', async () => {
    const res = await createGoal({ description: undefined })

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

// ─── GET /goals ───────────────────────────────────────────────────────────────

describe('GET /goals', () => {
  it('returns empty array when no goals exist', async () => {
    const res = await request.get('/goals').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.count).toBe(0)
  })

  it('returns all goals', async () => {
    await createGoal({ title: 'Goal 1' })
    await createGoal({ title: 'Goal 2' })

    const res = await request.get('/goals').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.count).toBe(2)
  })

  it('filters goals by status', async () => {
    await createGoal({ title: 'Planned goal' })
    const created = await createGoal({ title: 'In progress goal' })
    await request
      .patch(`/goals/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    const res = await request
      .get('/goals?status=in_progress')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.count).toBe(1)
    expect(res.body.data[0].status).toBe('in_progress')
  })

  it('returns 422 for invalid status filter', async () => {
    const res = await request
      .get('/goals?status=nonsense')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

// ─── GET /goals/:id ───────────────────────────────────────────────────────────

describe('GET /goals/:id', () => {
  it('returns a goal by id', async () => {
    const created = await createGoal()
    const id = created.body.data.id

    const res = await request
      .get(`/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(id)
  })

  it('returns 404 for unknown id', async () => {
    const res = await request
      .get('/goals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 422 for non-uuid id', async () => {
    const res = await request
      .get('/goals/not-a-uuid')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

// ─── PATCH /goals/:id ─────────────────────────────────────────────────────────

describe('PATCH /goals/:id', () => {
  it('updates a goal', async () => {
    const created = await createGoal()
    const id = created.body.data.id

    const res = await request
      .patch(`/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('in_progress')
  })

  it('returns 404 for unknown id', async () => {
    const res = await request
      .patch('/goals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('NOT_FOUND')
  })

  it('returns 422 for empty body', async () => {
    const created = await createGoal()
    const res = await request
      .patch(`/goals/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 for invalid status', async () => {
    const created = await createGoal()
    const res = await request
      .patch(`/goals/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid' })

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})

// ─── GET /goals (pagination + sorting) ───────────────────────────────────────

describe('GET /goals (pagination + sorting)', () => {
  it('returns paginated results', async () => {
    await createGoal({ title: 'Goal 1' })
    await createGoal({ title: 'Goal 2' })
    await createGoal({ title: 'Goal 3' })

    const res = await request
      .get('/goals?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.count).toBe(3) // total, not just page
  })

  it('returns second page correctly', async () => {
    await createGoal({ title: 'Goal 1' })
    await createGoal({ title: 'Goal 2' })
    await createGoal({ title: 'Goal 3' })

    const res = await request
      .get('/goals?page=2&pageSize=2')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.count).toBe(3)
  })

  it('returns goals sorted by createdAt asc', async () => {
    await createGoal({ title: 'First' })
    await createGoal({ title: 'Second' })

    const res = await request
      .get('/goals?sort=createdAt&order=asc')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0].title).toBe('First')
    expect(res.body.data[1].title).toBe('Second')
  })

  it('returns goals sorted by createdAt desc', async () => {
    await createGoal({ title: 'First' })
    await createGoal({ title: 'Second' })

    const res = await request
      .get('/goals?sort=createdAt&order=desc')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0].title).toBe('Second')
    expect(res.body.data[1].title).toBe('First')
  })

  it('returns 422 for invalid sort field', async () => {
    const res = await request
      .get('/goals?sort=invalid')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 422 for invalid page value', async () => {
    const res = await request
      .get('/goals?page=0')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })
})
