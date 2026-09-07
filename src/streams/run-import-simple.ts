import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import { prisma } from '../lib/prisma.js';

async function main() {
  const filePath = process.argv[2] || 'src/streams/test-data.csv';
  const userId = 'cfc2e567-bb20-4979-9466-f3fed3bb307d';

  console.log('Starting simple import from:', filePath);

  const fileStream = createReadStream(filePath, { encoding: 'utf8' });
  const parser = parse({ columns: true, skip_empty_lines: true, trim: true });

  let count = 0;

  for await (const row of fileStream.pipe(parser)) {
    const title = row.title?.trim();
    const description = row.description?.trim() ?? '';

    // Map CSV status to schema enum
    const rawStatus = (row.status ?? '').toLowerCase();
    const status =
      rawStatus === 'done' || rawStatus === 'completed'
        ? 'done'
        : rawStatus === 'in_progress'
          ? 'in_progress'
          : 'planned';

    if (!title) {
      console.warn('Skipping row with missing title:', row);
      continue;
    }

    try {
      await prisma.learningGoal.create({
        data: { title, description, status, userId },
      });
      count++;
      console.log('Inserted:', title);
    } catch (err) {
      console.error('Failed to insert row:', row);
      console.error('Error:', err instanceof Error ? err.message : err);
    }
  }

  console.log('Done. Inserted', count, 'goals.');

  const total = await prisma.learningGoal.count();
  console.log('Total goals in DB:', total);

  await prisma.$disconnect();
}

main().catch(console.error);
