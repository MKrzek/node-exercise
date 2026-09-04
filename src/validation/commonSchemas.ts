// src/validation/commonSchemas.js
import { z } from 'zod'

export const IdParamSchema = z.object({
  id: z.uuid('Invalid ID format'),
})

export type IdParam = z.infer<typeof IdParamSchema>
