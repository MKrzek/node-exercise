import { z } from 'zod'
import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authService } from '../services/authService.js'
import { AppError } from '../errors/AppError.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'

const router = Router()

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character')

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function setAuthCookies(
  res: import('express').Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  })

  // Refresh token is scoped to /auth so it's never sent on normal API requests
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  })
}

function clearAuthCookies(res: import('express').Response) {
  res.clearCookie('accessToken', { path: '/' })
  res.clearCookie('refreshToken', { path: '/auth' })
}

router.post(
  '/register',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError('Validation error', 422, 'VALIDATION_ERROR')
    }

    const result = await authService.register(parsed.data.email, parsed.data.password, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    })

    setAuthCookies(res, result.accessToken, result.refreshToken)

    res.status(201).json({ data: { userId: result.userId, role: result.role } })
  }),
)

router.post(
  '/login',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError('Validation error', 422, 'VALIDATION_ERROR')
    }

    const result = await authService.login(parsed.data.email, parsed.data.password, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    })

    setAuthCookies(res, result.accessToken, result.refreshToken)

    res.json({ data: { userId: result.userId, role: result.role } })
  }),
)

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) {
      throw new AppError('No refresh token provided', 401, 'NO_REFRESH_TOKEN')
    }

    try {
      const result = await authService.refresh(refreshToken)
      setAuthCookies(res, result.accessToken, result.refreshToken)
      res.json({ data: { userId: result.userId, role: result.role } })
    } catch (err) {
      // If rotation fails (reuse/expired), force the client to re-authenticate
      clearAuthCookies(res)
      throw err
    }
  }),
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (refreshToken) {
      await authService.logout(refreshToken)
    }
    clearAuthCookies(res)
    res.status(204).send()
  }),
)

export default router
