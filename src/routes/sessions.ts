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

const router = Router({ mergeParams: true })

router.post(
  '/',
  validate(IdParamSchema, 'params'),
  validate(CreateSessionSchema),
  asyncHandler(async (req, res) => {
    const { id: goalId } = req.parsed?.params as IdParam
    const session = await sessionService.create(
      goalId,
      req.parsed?.body as CreateSessionInput,
    )
    res.status(201).json({ data: session })
  }),
)

router.get(
  '/',
  validate(IdParamSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { id: goalId } = req.parsed?.params as IdParam
    const sessions = await sessionService.getByGoalId(goalId)
    res.json({ data: sessions, count: sessions.length })
  }),
)

export default router
