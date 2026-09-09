/**
 * Local QA helper: removes casebook cases so the API rebuilds them from the casebook
 * files on the next request. Use it to replay a Lab session from the start.
 *
 *   npx tsx scripts/lab-reset-case.ts R01 R04
 *
 * It deletes, it never edits a frozen run: history is rebuilt from source, not mutated.
 */
import { PrismaClient } from '@prisma/client';

const keys = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const prisma = new PrismaClient();

async function main() {
  if (!keys.length) {
    console.error('Usage: npx tsx scripts/lab-reset-case.ts <casebook key> [...]');
    process.exitCode = 1;
    return;
  }
  for (const key of keys) {
    const cases = await prisma.labCase.findMany({ where: { casebookKey: key } });
    if (!cases.length) {
      console.log(`${key}: nothing to reset`);
      continue;
    }
    for (const item of cases) {
      await prisma.labCase.delete({ where: { id: item.id } });
      console.log(`${key}: removed case ${item.id}, it will be rebuilt from the casebook`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
