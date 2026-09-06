import { Router } from 'express'
import { learningGoalService } from '../services/learningGoalService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  CreateGoalSchema,
  GoalQuerySchema,
  UpdateGoalSchema,
  type GoalQuery,
  type CreateGoalInput,
} from '../validation/learningGoalSchemas.js'
import { validate } from '../middleware/validate.js'
import { IdParamSchema, type IdParam } from '../validation/commonSchemas.js'
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js'
import { requireAuth } from '../middleware/rbac.js'

const router = Router()
router.use(requireAuth)

router.get(
  '/',
  authenticate,
  validate(GoalQuerySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = req.parsed?.query as GoalQuery
    const { data, total } = await learningGoalService.getAll({
      ...query,
      userId: req.userId!,
    })
    res.json({ data, count: total })
  }),
)

router.get(
  '/:id',
  authenticate,
  validate(IdParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.parsed?.params as IdParam
    const goal = await learningGoalService.getById(id, req.userId!)
    res.json({ data: goal })
  }),
)

router.post(
  '/',
  authenticate,
  validate(CreateGoalSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = req.parsed?.body as CreateGoalInput
    const goal = await learningGoalService.create({
      ...body,
      userId: req.userId!,
    })
    res.status(201).json({ data: goal })
  }),
)

router.patch(
  '/:id',
  authenticate,
  validate(UpdateGoalSchema),
  validate(IdParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.parsed?.params as IdParam
    const goal = await learningGoalService.update(id, req.body, req.userId!)
    res.json({ data: goal })
  }),
)

export default router
