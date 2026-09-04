import { z } from 'zod'

export const GoalStatusSchema = z.enum(['planned', 'in_progress', 'done'])
export type GoalStatus = z.infer<typeof GoalStatusSchema>

export const CreateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description too long'),
  status: GoalStatusSchema.optional(),
})

export const UpdateGoalSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(500).optional(),
    status: GoalStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export const GoalQuerySchema = z.object({
  status: z.enum(['planned', 'in_progress', 'done']).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
})

// infer types directly from schemas — single source of truth
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>
export type GoalQuery = z.infer<typeof GoalQuerySchema>
