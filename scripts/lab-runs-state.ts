import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.labCase.findMany({
    where: { archivedAt: null },
    include: {
      runs: {
        orderBy: { startedAt: 'desc' },
        include: {
          expectations: { select: { id: true } },
          reviews: { select: { id: true } },
        },
      },
    },
    orderBy: { label: 'asc' },
  });
  for (const item of cases) {
    const runs = item.runs
      .map(
        (run) =>
          `${run.status}:${run.id.slice(0, 8)}${run.expectations.length ? '+exp' : ''}${
            run.reviews.length ? '+rev' : ''
          }`,
      )
      .join(' ');
    console.log(`${item.casebookKey ?? item.fixtureKey ?? '-'} | ${item.label} | ${runs || 'sin runs'}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
