import { PrismaClient } from '@prisma/client';

import { getSystemPersonaSeedRows } from '../admin/system-personas.seed';

const prisma = new PrismaClient();

async function main() {
  const rows = getSystemPersonaSeedRows();

  for (const row of rows) {
    const { id, ...data } = row;
    await prisma.systemPersona.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }

  console.log(`Seeded ${rows.length} system personas.`);
}

main()
  .catch((error) => {
    console.error('Failed to seed system personas.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
