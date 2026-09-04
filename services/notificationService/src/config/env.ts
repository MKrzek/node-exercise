import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3000'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
}
