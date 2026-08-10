// Full password-reset E2E, run separately from run-auth.mjs because it needs
// the raw reset token, which only exists in the API's stdout log locally
// (RESEND_API_KEY unset -> MailService logs the link instead of sending it).
// Usage: node qa/run-auth-reset.mjs <resetUrlOrToken> <email> <oldPassword>
import { request } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const API = 'http://localhost:4000';
const EVIDENCE = path.join(process.cwd(), 'qa/evidence/auth');

const [, , rawArg, email, oldPassword] = process.argv;
if (!rawArg || !email || !oldPassword) {
  console.error('Usage: node qa/run-auth-reset.mjs <resetUrlOrToken> <email> <oldPassword>');
  process.exit(1);
}
const token = rawArg.includes('token=') ? new URL(rawArg).searchParams.get('token') : rawArg;
const newPassword = 'QaAuditReset456!';

const results = [];
const record = (id, description, pass, detail) => {
  results.push({ id, description, pass, detail });
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${id}: ${description}${detail ? ' — ' + JSON.stringify(detail) : ''}`);
};
const isSuccess = (s) => s === 200 || s === 201;

async function main() {
  const ctx = await request.newContext({ baseURL: API });

  const badToken = await ctx.post('/api/v1/auth/reset-password', { data: { token: 'not-a-real-token', password: newPassword } });
  record('AUTH-RESET-02', 'Garbage reset token rejected with 400', badToken.status() === 400, { status: badToken.status() });

  const resetOk = await ctx.post('/api/v1/auth/reset-password', { data: { token, password: newPassword } });
  const resetOkBody = await resetOk.json().catch(() => null);
  record('AUTH-RESET-03', 'Valid reset token accepted', isSuccess(resetOk.status()), { status: resetOk.status(), body: resetOkBody });

  const reuseToken = await ctx.post('/api/v1/auth/reset-password', { data: { token, password: 'AnotherPassword789!' } });
  record('SEC-REPLAY-02', 'Reset token cannot be reused a second time (single-use)', reuseToken.status() === 400, { status: reuseToken.status() });

  const loginOldPw = await ctx.post('/api/v1/auth/login', { data: { email, password: oldPassword } });
  record('AUTH-RESET-04', 'OLD password no longer works after reset', loginOldPw.status() === 401, { status: loginOldPw.status() });

  const loginNewPw = await ctx.post('/api/v1/auth/login', { data: { email, password: newPassword } });
  record('AUTH-RESET-05', 'NEW password works after reset', isSuccess(loginNewPw.status()), { status: loginNewPw.status() });

  await ctx.dispose();
  fs.writeFileSync(path.join(EVIDENCE, 'auth-reset-results.json'), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length} checks, ${failed.length} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
