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
  password: z.string().min(1, 'Password is required'), // loose — just needs to exist
})

router.post(
  '/register',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError('Validation error', 422, 'VALIDATION_ERROR')
    }
    const result = await authService.register(parsed.data.email, parsed.data.password)

    // Set HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

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
    const result = await authService.login(parsed.data.email, parsed.data.password)

    // Set HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({ data: { userId: result.userId, role: result.role } })
  }),
)

export default router
