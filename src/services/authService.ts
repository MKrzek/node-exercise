import * as bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/userRepository.js'
import { AppError } from '../errors/AppError.js'

const JWT_SECRET_RAW = process.env.JWT_SECRET
if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET: string = JWT_SECRET_RAW

const SALT_ROUNDS = 12
const ACCESS_TOKEN_EXPIRY = '7d'

export interface AuthPayload {
  userId: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthResponse {
  token: string
  userId: string
  role: 'user' | 'admin'
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const existing = await userRepository.findByEmail(email)
    if (existing) {
      throw new AppError('Email already in use', 409, 'EMAIL_TAKEN')
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await userRepository.create(email, passwordHash)

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role ?? 'user',
      } as AuthPayload,
      JWT_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    )

    return {
      token,
      userId: user.id,
      role: user.role ?? 'user',
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(email)
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS')
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role ?? 'user',
      } as AuthPayload,
      JWT_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    )

    return {
      token,
      userId: user.id,
      role: user.role ?? 'user',
    }
  },
}
