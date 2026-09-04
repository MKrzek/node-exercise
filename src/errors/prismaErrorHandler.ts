import { Prisma } from '@prisma/client'
import { AppError } from './AppError.js'

export function handlePrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        throw new AppError('A record with that value already exists', 409, 'CONFLICT')
      case 'P2025':
        throw new AppError('Record not found', 404, 'NOT_FOUND')
      case 'P2003':
        throw new AppError(
          'Invalid reference — related record does not exist',
          400,
          'INVALID_REFERENCE',
        )
      case 'P2024':
        throw new AppError(
          'Database connection pool timeout',
          503,
          'SERVICE_UNAVAILABLE',
        )
      default:
        throw new AppError(`Database error: ${err.code}`, 500, 'DATABASE_ERROR')
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    throw new AppError(
      'Invalid data sent to database',
      400,
      'DATABASE_VALIDATION_ERROR',
    )
  }

  // not a Prisma error — rethrow as-is
  throw err
}
