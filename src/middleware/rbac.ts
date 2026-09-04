import type { Request, Response, NextFunction } from 'express'

export type Role = 'user' | 'admin'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user
  if (!user) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
    return
  }
  next()
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user
    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
      return
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      })
      return
    }

    next()
  }
}
