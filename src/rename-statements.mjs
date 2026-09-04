import fs from 'fs'
import path from 'path'

const folder = path.join(process.env.HOME, 'Desktop/UK PASSPORT DOCS/bank statements')

const monthMap = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
}

const files = fs.readdirSync(folder)

for (const file of files) {
  const fullPath = path.join(folder, file)
  const stat = fs.statSync(fullPath)
  if (!stat.isFile()) continue

  const ext = path.extname(file)

  // Match things like 12-AUG-25
  const match = file.match(/\b(\d{2})-([A-Z]{3})-(\d{2})\b/i)

  if (!match) {
    console.log(`Skipping (no matching date): ${file}`)
    continue
  }

  const [, dayRaw, monthRaw, yearRaw] = match
  const day = dayRaw.padStart(2, '0')
  const month = monthMap[monthRaw.toUpperCase()]

  if (!month) {
    console.log(`Skipping (invalid month): ${file}`)
    continue
  }

  const year = `20${yearRaw}`
  const isoDate = `${year}-${month}-${day}`
  const newName = `${isoDate}-bank-statement${ext}`
  const newPath = path.join(folder, newName)

  if (file === newName) {
    console.log(`Already correct: ${file}`)
    continue
  }

  if (fs.existsSync(newPath)) {
    console.log(`Skipping (target exists): ${newName}`)
    continue
  }

  try {
    fs.renameSync(fullPath, newPath)
    console.log(`Renamed: ${file} -> ${newName}`)
  } catch (error) {
    console.error(`Failed: ${file}`, error)
  }
}
