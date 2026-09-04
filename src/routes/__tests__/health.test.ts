import supertest from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../../app.js'

const request = supertest(app)

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request.get('/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.version).toBeDefined()
    expect(res.body.uptime).toBeDefined()
    expect(res.body.memory).toBeDefined()
    expect(res.body.timestamp).toBeDefined()
  })

  it('returns memory stats', async () => {
    const res = await request.get('/health')

    expect(res.body.memory.heapUsedMb).toBeGreaterThan(0)
    expect(res.body.memory.heapTotalMb).toBeGreaterThan(0)
    expect(res.body.memory.rssMb).toBeGreaterThan(0)
  })

  it('returns uptime in human readable format', async () => {
    const res = await request.get('/health')

    expect(res.body.uptime.ms).toBeGreaterThan(0)
    expect(res.body.uptime.human).toMatch(/\d+(s|m|h|d)/)
  })
})

describe('GET /ready', () => {
  it('returns 200 when all dependencies are up', async () => {
    const res = await request.get('/ready')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ready')
    expect(res.body.checks.database).toBe('ok')
    expect(res.body.checks.redis).toBe('ok')
  })
})

describe('GET /metrics', () => {
  it('returns request metrics', async () => {
    const res = await request.get('/metrics')

    expect(res.status).toBe(200)
    expect(res.body.data.requestCount).toBeGreaterThanOrEqual(0)
    expect(res.body.data.errorCount).toBeGreaterThanOrEqual(0)
    expect(res.body.data.avgResponseTimeMs).toBeGreaterThanOrEqual(0)
    expect(res.body.data.errorRate).toBeGreaterThanOrEqual(0)
  })
})
