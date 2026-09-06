import type { Request, Response, NextFunction } from 'express'

const MONOLITH_SECRET = process.env.MONOLITH_SECRET
if (!MONOLITH_SECRET) {
  throw new Error('MONOLITH_SECRET environment variable is required')
}

export function authenticateMonolith(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]
  if (token !== MONOLITH_SECRET) {
    res.status(403).json({ error: 'Invalid credentials' })
    return
  }

  next()
}
