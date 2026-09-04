import supertest from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import app from '../../app.js'
import { resetDb } from '../../test/helpers.js'

const request = supertest(app)

beforeEach(async () => {
  await resetDb()
})

describe('POST /auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request.post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(201)
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.userId).toBeDefined()
  })

  it('returns 422 for invalid email', async () => {
    const res = await request.post('/auth/register').send({
      email: 'not-an-email',
      password: 'password123',
    })

    expect(res.status).toBe(422)
  })

  it('returns 422 for short password', async () => {
    const res = await request.post('/auth/register').send({
      email: 'test@example.com',
      password: '123',
    })

    expect(res.status).toBe(422)
  })

  it('returns 409 for duplicate email', async () => {
    await request.post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })

    const res = await request.post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('EMAIL_TAKEN')
  })
})

describe('POST /auth/login', () => {
  it('logs in and returns a token', async () => {
    await request.post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })

    const res = await request.post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeDefined()
  })

  it('returns 401 for wrong password', async () => {
    await request.post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })

    const res = await request.post('/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 401 for unknown email', async () => {
    const res = await request.post('/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(401)
  })
})

describe('GET /goals (protected)', () => {
  it('returns 401 without a token', async () => {
    const res = await request.get('/goals')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 with an invalid token', async () => {
    const res = await request.get('/goals').set('Authorization', 'Bearer invalidtoken')
    expect(res.status).toBe(401)
  })

  it('returns 200 with a valid token', async () => {
    const register = await request.post('/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
    })
    const token = register.body.data.token

    const res = await request.get('/goals').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })
})
