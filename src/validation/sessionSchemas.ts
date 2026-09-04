import { z } from 'zod'

export const CreateSessionSchema = z.object({
  durationMinutes: z.number().int().min(1).max(480),
  notes: z.string().max(1000).optional(),
})

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>
