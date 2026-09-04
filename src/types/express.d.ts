import type { ZodTypeAny, z } from 'zod'

declare global {
  namespace Express {
    interface Request {
      parsed?: {
        body?: unknown
        query?: unknown
        params?: unknown
      }
      correlationId: string
      correlationId?: string
      abortController?: AbortController
      abortSignal?: AbortSignal
    }
  }
}
