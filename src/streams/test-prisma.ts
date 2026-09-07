import { prisma } from '../lib/prisma.js';

async function main() {
  console.log('Connecting to DB...');
  await prisma.$connect();
  console.log('Connected!');

  const count = await prisma.learningGoal.count();
  console.log('Existing goals:', count);

  await prisma.$disconnect();
}

main().catch(console.error);
