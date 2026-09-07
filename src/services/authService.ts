import * as bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/userRepository.js'
import { AppError } from '../errors/AppError.js'
import { authSessionService, SessionReuseError } from './authSessionService.js'

const JWT_SECRET_RAW = process.env.JWT_SECRET
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '20d'
if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET: string = JWT_SECRET_RAW

const SALT_ROUNDS = 12

export interface AuthPayload {
  userId: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: string
  role: 'user' | 'admin'
}

function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export const authService = {
  async register(
    email: string,
    password: string,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthResponse> {
    const existing = await userRepository.findByEmail(email)
    if (existing) {
      throw new AppError('Email already in use', 409, 'EMAIL_TAKEN')
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await userRepository.create(email, passwordHash)
    const role = user.role ?? 'user'

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role })
    const { refreshToken } = await authSessionService.createSession(user.id, meta)

    return { accessToken, refreshToken, userId: user.id, role }
  },

  async login(
    email: string,
    password: string,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(email)
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const role = user.role ?? 'user'
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role })
    const { refreshToken } = await authSessionService.createSession(user.id, meta)

    return { accessToken, refreshToken, userId: user.id, role }
  },

  /** Called by the /refresh endpoint. Rotates the refresh token and issues a new access token. */
  async refresh(oldRefreshToken: string): Promise<AuthResponse> {
    let rotated
    try {
      rotated = await authSessionService.rotateSession(oldRefreshToken)
    } catch (err) {
      if (err instanceof SessionReuseError) {
        throw new AppError(
          'Session expired, please log in again',
          401,
          'SESSION_INVALID',
        )
      }
      throw err
    }

    const user = await userRepository.findById(rotated.userId)
    if (!user) {
      throw new AppError('User not found', 401, 'SESSION_INVALID')
    }

    const role = user.role ?? 'user'
    const accessToken = signAccessToken({ userId: user.id, email: user.email, role })

    return { accessToken, refreshToken: rotated.refreshToken, userId: user.id, role }
  },

  async logout(refreshToken: string): Promise<void> {
    await authSessionService.revokeToken(refreshToken)
  },

  async logoutAllDevices(userId: string): Promise<void> {
    await authSessionService.revokeAllForUser(userId)
  },
}
