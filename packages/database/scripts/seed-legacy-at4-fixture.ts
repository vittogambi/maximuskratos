/**
 * T7.3 placeholder: loads or creates legacy@4 fixture user for HTTP smoke tests.
 * Extend with full row snapshot when staging @4 catalog is pinned in CI.
 */
import { PrismaClient } from '@prisma/client';

const EMAIL = 'legacy.at4@fixtures.mk.invalid';

async function main() {
  const db = new PrismaClient();
  const user = await db.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, passwordHash: 'fixture', role: 'MEMBER', onboardingStep: 'PROFILE_COMPLETE' },
    update: {},
  });
  console.log(JSON.stringify({ ok: true, userId: user.id, email: EMAIL, note: 'Extend with @4 session and signed purpose rows.' }));
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
