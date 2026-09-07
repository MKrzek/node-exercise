import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js'
import { requireAuth } from '../middleware/rbac.js'
import { uploadCsv } from '../middleware/upload.js'
import { importGoalsFromCsv } from '../streams/csvImportService.js'
import fs from 'node:fs/promises'

const router = Router()
router.use(requireAuth)

router.post(
  '/import',
  authenticate,
  uploadCsv.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    try {
      const result = await importGoalsFromCsv(req.file.path, req.userId!)
      res.json({ data: result })
    } finally {
      await fs.unlink(req.file.path).catch(() => {})
    }
  }),
)

export default router
