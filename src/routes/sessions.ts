// src/routes/sessions.js
import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'

import { IdParamSchema, type IdParam } from '../validation/commonSchemas.js'
import {
  CreateSessionSchema,
  type CreateSessionInput,
} from '../validation/sessionSchemas.js'
import { sessionService } from '../services/sessionService.js'
import { validate } from '../middleware/validate.js'
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js'
import { requireAuth } from '../middleware/rbac.js'

const router = Router({ mergeParams: true })
router.use(requireAuth)

router.post(
  '/',
  authenticate,
  validate(IdParamSchema, 'params'),
  validate(CreateSessionSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id: goalId } = req.parsed?.params as IdParam
    const session = await sessionService.create(
      goalId,
      req.parsed?.body as CreateSessionInput,
      req.userId!,
    )
    res.status(201).json({ data: session })
  }),
)

router.get(
  '/',
  authenticate,
  validate(IdParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id: goalId } = req.parsed?.params as IdParam
    const sessions = await sessionService.getByGoalId(goalId, req.userId!)
    res.json({ data: sessions, count: sessions.length })
  }),
)

export default router
