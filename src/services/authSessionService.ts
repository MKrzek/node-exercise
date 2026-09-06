import { randomUUID, randomBytes } from 'crypto'
import { redis } from '../lib/redis.js'

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days
const SESSION_FAMILY_PREFIX = 'authsession:family:'
const REFRESH_TOKEN_PREFIX = 'authsession:token:'
const USER_SESSIONS_PREFIX = 'authsession:user:'

export interface AuthSessionData {
  userId: string
  familyId: string
  createdAt: number
  userAgent?: string
  ip?: string
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export class SessionReuseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionReuseError'
  }
}

export const authSessionService = {
  async createSession(
    userId: string,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<{ refreshToken: string; familyId: string }> {
    const familyId = randomUUID()
    const refreshToken = generateOpaqueToken()

    const data: AuthSessionData = {
      userId,
      familyId,
      createdAt: Date.now(),
      ...meta,
    }

    await redis.set(
      `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
      JSON.stringify(data),
      { EX: REFRESH_TOKEN_TTL_SECONDS },
    )

    await redis.sAdd(`${SESSION_FAMILY_PREFIX}${familyId}`, refreshToken)
    await redis.expire(`${SESSION_FAMILY_PREFIX}${familyId}`, REFRESH_TOKEN_TTL_SECONDS)

    await redis.sAdd(`${USER_SESSIONS_PREFIX}${userId}`, familyId)
    await redis.expire(`${USER_SESSIONS_PREFIX}${userId}`, REFRESH_TOKEN_TTL_SECONDS)

    return { refreshToken, familyId }
  },

  async rotateSession(
    oldRefreshToken: string,
  ): Promise<{ refreshToken: string; userId: string; familyId: string }> {
    const raw = await redis.get(`${REFRESH_TOKEN_PREFIX}${oldRefreshToken}`)

    if (!raw) {
      throw new SessionReuseError('Refresh token invalid or already used')
    }

    const data: AuthSessionData = JSON.parse(raw)

    await redis.del(`${REFRESH_TOKEN_PREFIX}${oldRefreshToken}`)
    await redis.sRem(`${SESSION_FAMILY_PREFIX}${data.familyId}`, oldRefreshToken)

    const newRefreshToken = generateOpaqueToken()
    const newData: AuthSessionData = { ...data, createdAt: Date.now() }

    await redis.set(
      `${REFRESH_TOKEN_PREFIX}${newRefreshToken}`,
      JSON.stringify(newData),
      { EX: REFRESH_TOKEN_TTL_SECONDS },
    )
    await redis.sAdd(`${SESSION_FAMILY_PREFIX}${data.familyId}`, newRefreshToken)
    await redis.expire(
      `${SESSION_FAMILY_PREFIX}${data.familyId}`,
      REFRESH_TOKEN_TTL_SECONDS,
    )

    return { refreshToken: newRefreshToken, userId: data.userId, familyId: data.familyId }
  },

  async revokeToken(refreshToken: string): Promise<void> {
    const raw = await redis.get(`${REFRESH_TOKEN_PREFIX}${refreshToken}`)
    if (raw) {
      const data: AuthSessionData = JSON.parse(raw)
      await redis.sRem(`${SESSION_FAMILY_PREFIX}${data.familyId}`, refreshToken)
    }
    await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`)
  },

  async revokeFamily(familyId: string): Promise<void> {
    const tokens = await redis.sMembers(`${SESSION_FAMILY_PREFIX}${familyId}`)
    if (tokens.length > 0) {
      await redis.del(tokens.map((t) => `${REFRESH_TOKEN_PREFIX}${t}`))
    }
    await redis.del(`${SESSION_FAMILY_PREFIX}${familyId}`)
  },

  async revokeAllForUser(userId: string): Promise<void> {
    const familyIds = await redis.sMembers(`${USER_SESSIONS_PREFIX}${userId}`)
    for (const familyId of familyIds) {
      await authSessionService.revokeFamily(familyId)
    }
    await redis.del(`${USER_SESSIONS_PREFIX}${userId}`)
  },
}
