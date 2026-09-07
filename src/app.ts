import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import learningGoalRoutes from './routes/learningGoals.js'
import authRoutes from './routes/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { requestLogger } from './middleware/requestLogger.js'
import { correlationIdMiddleware } from './middleware/correlationId.js'
import sessionRoutes from './routes/sessions.js'
import csvImportRoutes from './routes/csvImport.js'
import statsRoutes from './routes/stats.js'
import './types/express.d.js'

import './background/queues/emailWorker.js' // start the email worker when app starts
import { startScheduler } from './background/scheduler.js'
import queueRoutes from './routes/queue.js'
import healthRoutes from './routes/health.js'
import versionRoutes from './routes/version.js'
import readyRoutes from './routes/ready.js'
import metricsRoutes from './routes/metrics.js'
import { requestAbortMiddleware } from './middleware/requestAbort.js'
import * as csurfModule from '@dr.pogodin/csurf'
import type { Request, Response, NextFunction } from 'express'

type CsurfOptions = {
  cookie?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'none' | 'strict' | true
  }
}
type CsurfMiddleware = (req: Request, res: Response, next: NextFunction) => void

const csurf = (
  csurfModule as unknown as { default: (options?: CsurfOptions) => CsurfMiddleware }
).default

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.JWT_SECRET ?? 'dev-secret'))

// Add correlation ID to all requests
app.use(correlationIdMiddleware)

app.use(requestAbortMiddleware)

app.use(requestLogger)

// Auth routes are CSRF-exempt — they're how a client establishes its first session
app.use('/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'It is running', correlationId: req.correlationId })
})

app.use('/health', healthRoutes)
app.use('/ready', readyRoutes)
app.use('/metrics', metricsRoutes)
app.use('/version', versionRoutes)

// CSRF protection for state-changing requests — applied AFTER auth routes
// CSRF protection for state-changing requests — applied AFTER auth routes
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
})

app.use((req, res, next) => {
  // Skip CSRF for auth routes and safe methods
  if (req.path.startsWith('/auth') || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }
  return csrfProtection(req, res, next)
})

app.use('/queue', queueRoutes)
app.use('/goals', learningGoalRoutes)
app.use('/goals', csvImportRoutes)
app.use('/goals/:id/sessions', sessionRoutes)
app.use('/stats', statsRoutes)

app.use(notFound)

// Error handler (must be last)
app.use(errorHandler)
startScheduler()

export default app
