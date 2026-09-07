import { createReadStream } from 'node:fs'
import { parse } from 'csv-parse'
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'
import { prisma } from '../lib/prisma.js'
import { randomUUID } from 'node:crypto'

interface ImportResult {
  imported: number
  failed: number
  errors: string[]
}

const VALID_STATUSES = ['planned', 'in_progress', 'completed'] as const

export async function importGoalsFromCsv(
  filePath: string,
  userId: string,
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, failed: 0, errors: [] }

  const BATCH_SIZE = 100
  let batch: Array<{ id: string; userId: string; title: string; description: string; status: string }> = []

  const flushBatch = async () => {
    if (batch.length === 0) return
    try {
      await prisma.learningGoal.createMany({ data: batch })
      result.imported += batch.length
    } catch (err) {
      result.failed += batch.length
      result.errors.push(err instanceof Error ? err.message : 'Batch insert failed')
    }
    batch = []
  }

  const validateAndCollect = new Transform({
    objectMode: true,
    async transform(row, _enc, callback) {
      const title = row.title?.trim()
      const description = row.description?.trim() ?? ''
      const status = VALID_STATUSES.includes(row.status) ? row.status : 'planned'

      if (!title) {
        result.failed += 1
        result.errors.push(`Skipped row with missing title: ${JSON.stringify(row)}`)
        return callback()
      }

      batch.push({ id: randomUUID(), userId, title, description, status })

      if (batch.length >= BATCH_SIZE) {
        await flushBatch()
      }

      callback()
    },
    async flush(callback) {
      await flushBatch()
      callback()
    },
  })

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  await pipeline(createReadStream(filePath), parser, validateAndCollect)

  return result
}
