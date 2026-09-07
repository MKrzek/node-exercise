import { importGoalsFromCsv } from './csvImportService.js';
import { prisma } from '../lib/prisma.js';

async function main() {
  const filePath = process.argv[2];
  const userId = 'cfc2e567-bb20-4979-9466-f3fed3bb307d';

  if (!filePath) {
    console.error('Usage: run-import.ts <csv-path>');
    process.exit(1);
  }

  console.log('Starting import from:', filePath);
  console.log('User ID:', userId);

  try {
    const result = await importGoalsFromCsv(filePath, userId);
    console.log('Import result:', JSON.stringify(result, null, 2));

    const count = await prisma.learningGoal.count();
    console.log('Total goals after import:', count);
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
