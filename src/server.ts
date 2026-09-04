// server.js
import 'dotenv/config' // or: import dotenv from 'dotenv'; dotenv.config();

import app from './app.js'
import { env } from './config/env.js'
import { ensureRedisConnected } from './lib/redis.js'

await ensureRedisConnected()

const PORT = env.port

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
