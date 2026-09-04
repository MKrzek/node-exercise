import express from 'express'

import { notificationRoutes } from './routes/notificationRoutes.js'

import { env } from './config/env.js'
import { logger } from './lib/logger.js'

const app = express()

app.use(express.json())
app.use('/notifications', notificationRoutes)

app.listen(env.port, () => {
  logger.info({ port: env.port }, `notification service listening on ${env.port}`)
})
