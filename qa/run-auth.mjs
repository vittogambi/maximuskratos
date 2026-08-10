// Fase 6 (auth slice) + Fase 8 (security sanity) — against the LOCAL stack
// (localhost:4000), never staging, so no test accounts get written into the
// staging database. Uses Playwright's APIRequestContext directly against the
// API; no browser needed for these checks.
import { request } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const API = 'http://localhost:4000';
const EVIDENCE = path.join(process.cwd(), 'qa/evidence/auth');
fs.mkdirSync(EVIDENCE, { recursive: true });

const results = [];
const record = (id, description, pass, detail) => {
  results.push({ id, description, pass, detail });
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${id}: ${description}${detail ? ' — ' + JSON.stringify(detail) : ''}`);
};

// NestJS POST handlers return 201 Created by default (no explicit @HttpCode),
// which is what this API actually does. Both 200 and 201 are treated as a
// successful response; the useful signal is "not 4xx/5xx", not the exact code.
const isSuccess = (status) => status === 200 || status === 201;

function parseCookie(setCookieHeader, name) {
  if (!setCookieHeader) return null;
  const lines = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const line of lines) {
    const m = line.match(new RegExp(`${name}=([^;]+)`));
    if (m) return m[1];
  }
  return null;
}

async function main() {
  const ctx = await request.newContext({ baseURL: API });
  const testEmail = `qa-audit-${Date.now()}@example.com`;
  const testPassword = 'QaAudit123!';

  console.log('\n== Registration ==');
  const reg1 = await ctx.post('/api/v1/auth/register', { data: { email: testEmail, password: testPassword } });
  const reg1Body = await reg1.json().catch(() => null);
  record('AUTH-REG-01', 'Register new user succeeds', reg1.status() === 200 || reg1.status() === 201, { status: reg1.status(), hasToken: !!reg1Body?.accessToken });
  record('AUTH-REG-02', 'Register response has no passwordHash/password field', !JSON.stringify(reg1Body).match(/password/i), { keys: Object.keys(reg1Body?.user ?? {}) });

  const reg2 = await ctx.post('/api/v1/auth/register', { data: { email: testEmail, password: testPassword } });
  record('AUTH-REG-03', 'Duplicate email rejected with 409', reg2.status() === 409, { status: reg2.status() });

  const regBadEmail = await ctx.post('/api/v1/auth/register', { data: { email: 'not-an-email', password: testPassword } });
  record('AUTH-REG-04', 'Invalid email format rejected with 400', regBadEmail.status() === 400, { status: regBadEmail.status() });

  const regShortPw = await ctx.post('/api/v1/auth/register', { data: { email: `qa-shortpw-${Date.now()}@example.com`, password: 'short' } });
  record('AUTH-REG-05', 'Short password rejected with 400', regShortPw.status() === 400, { status: regShortPw.status() });

  console.log('\n== Mass assignment ==');
  const massAssign = await ctx.post('/api/v1/auth/register', {
    data: { email: `qa-mass-${Date.now()}@example.com`, password: testPassword, role: 'ADMIN', onboardingStep: 'DONE' },
  });
  const massBody = await massAssign.json().catch(() => null);
  record(
    'SEC-MASS-01',
    'Extra fields (role, onboardingStep) in register body rejected, not silently accepted',
    massAssign.status() === 400,
    { status: massAssign.status(), body: massBody },
  );

  console.log('\n== Login ==');
  const loginOk = await ctx.post('/api/v1/auth/login', { data: { email: testEmail, password: testPassword } });
  const loginOkBody = await loginOk.json().catch(() => null);
  record('AUTH-LOGIN-01', 'Login with correct credentials succeeds', isSuccess(loginOk.status()), { status: loginOk.status() });
  const accessToken = loginOkBody?.accessToken;
  const setCookieLogin = loginOk.headers()['set-cookie'];
  const refreshCookieV1 = parseCookie(setCookieLogin, 'mk_refresh');
  record('AUTH-LOGIN-02', 'Login sets mk_refresh cookie', !!refreshCookieV1, {});

  const loginBadPw = await ctx.post('/api/v1/auth/login', { data: { email: testEmail, password: 'WrongPassword1!' } });
  const loginBadPwBody = await loginBadPw.json().catch(() => null);
  record('AUTH-LOGIN-03', 'Login with wrong password rejected with 401', loginBadPw.status() === 401, { status: loginBadPw.status() });

  const loginNoSuchUser = await ctx.post('/api/v1/auth/login', { data: { email: 'definitely-not-registered-qa@example.com', password: 'Whatever123!' } });
  const loginNoSuchUserBody = await loginNoSuchUser.json().catch(() => null);
  record(
    'SEC-ENUM-01',
    'Login error message identical for wrong-password vs nonexistent-user (no account enumeration)',
    loginBadPwBody?.message === loginNoSuchUserBody?.message,
    { wrongPwMsg: loginBadPwBody?.message, noUserMsg: loginNoSuchUserBody?.message },
  );

  console.log('\n== /auth/me ==');
  const meNoToken = await ctx.get('/api/v1/auth/me');
  record('AUTH-ME-01', 'No token rejected with 401', meNoToken.status() === 401, { status: meNoToken.status() });

  const meGarbageToken = await ctx.get('/api/v1/auth/me', { headers: { Authorization: 'Bearer not-a-real-jwt' } });
  record('AUTH-ME-02', 'Garbage token rejected with 401', meGarbageToken.status() === 401, { status: meGarbageToken.status() });

  const meOk = await ctx.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  const meOkBody = await meOk.json().catch(() => null);
  record('AUTH-ME-03', 'Valid token returns 200', meOk.status() === 200, { status: meOk.status() });
  record('SEC-LEAK-01', '/auth/me response contains no passwordHash', !('passwordHash' in (meOkBody ?? {})), { keys: Object.keys(meOkBody ?? {}) });

  console.log('\n== Refresh token rotation ==');
  const refreshResp = await ctx.post('/api/v1/auth/refresh', { headers: { Cookie: `mk_refresh=${refreshCookieV1}` } });
  const refreshBody = await refreshResp.json().catch(() => null);
  const setCookieRefresh = refreshResp.headers()['set-cookie'];
  const refreshCookieV2 = parseCookie(setCookieRefresh, 'mk_refresh');
  record('AUTH-REFRESH-01', 'Refresh with valid cookie returns new accessToken', isSuccess(refreshResp.status()) && !!refreshBody?.accessToken, { status: refreshResp.status() });
  record('AUTH-REFRESH-02', 'Refresh rotates the cookie (new value differs)', refreshCookieV2 && refreshCookieV2 !== refreshCookieV1, {});

  const reuseOldRefresh = await ctx.post('/api/v1/auth/refresh', { headers: { Cookie: `mk_refresh=${refreshCookieV1}` } });
  record('SEC-REPLAY-01', 'Reusing the OLD (rotated-out) refresh cookie is rejected with 401', reuseOldRefresh.status() === 401, { status: reuseOldRefresh.status() });

  console.log('\n== Authorization (admin gate) ==');
  const adminAsUser = await ctx.get('/api/v1/admin/users', { headers: { Authorization: `Bearer ${accessToken}` } });
  record('AUTHZ-01', 'Regular user hitting /admin/users gets 403 (not 401, not 200)', adminAsUser.status() === 403, { status: adminAsUser.status() });

  const adminNoToken = await ctx.get('/api/v1/admin/users');
  record('AUTHZ-02', 'Anonymous hitting /admin/users gets 401', adminNoToken.status() === 401, { status: adminNoToken.status() });

  const adminPlansNoToken = await ctx.get('/api/v1/admin/plans');
  record('AUTHZ-03', 'Anonymous hitting /admin/plans gets 401', adminPlansNoToken.status() === 401, { status: adminPlansNoToken.status() });

  console.log('\n== Admin login + data exposure ==');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@maximus-kratos.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeAdmin123!';
  const adminLogin = await ctx.post('/api/v1/auth/login', { data: { email: adminEmail, password: adminPassword } });
  const adminLoginBody = await adminLogin.json().catch(() => null);
  record('ADMIN-LOGIN-01', 'Seeded admin can log in', isSuccess(adminLogin.status()), { status: adminLogin.status(), role: adminLoginBody?.user?.role });

  if (adminLoginBody?.accessToken) {
    const adminToken = adminLoginBody.accessToken;
    const adminUsers = await ctx.get('/api/v1/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    const adminUsersBody = await adminUsers.json().catch(() => null);
    const bodyStr = JSON.stringify(adminUsersBody);
    record('ADMIN-USERS-01', 'Admin can list users (200)', adminUsers.status() === 200, { status: adminUsers.status(), count: Array.isArray(adminUsersBody) ? adminUsersBody.length : null });
    record('SEC-LEAK-02', 'Admin user list contains no passwordHash field', !bodyStr.match(/passwordHash|password_hash/i), {});

    const adminPlansOk = await ctx.get('/api/v1/admin/plans', { headers: { Authorization: `Bearer ${adminToken}` } });
    record('ADMIN-PLANS-01', 'Admin can list all plans incl. inactive (200)', adminPlansOk.status() === 200, { status: adminPlansOk.status() });
  }

  console.log('\n== Password reset (full E2E via API log capture) ==');
  const resetEmail = testEmail; // the account created above
  const forgotExisting = await ctx.post('/api/v1/auth/forgot-password', { data: { email: resetEmail } });
  const forgotExistingBody = await forgotExisting.json().catch(() => null);
  record(
    'AUTH-RESET-01',
    'forgot-password for existing user returns success:true',
    isSuccess(forgotExisting.status()) && forgotExistingBody?.success === true,
    { status: forgotExisting.status(), body: forgotExistingBody },
  );

  const forgotNonexistent = await ctx.post('/api/v1/auth/forgot-password', { data: { email: 'never-registered-qa@example.com' } });
  const forgotNonexistentBody = await forgotNonexistent.json().catch(() => null);
  record(
    'SEC-ENUM-02',
    'forgot-password for nonexistent user ALSO returns success:true (no enumeration)',
    isSuccess(forgotNonexistent.status()) && forgotNonexistentBody?.success === true,
    { status: forgotNonexistent.status(), body: forgotNonexistentBody },
  );

  await ctx.dispose();

  fs.writeFileSync(path.join(EVIDENCE, 'auth-results.json'), JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length} checks, ${failed.length} failed.`);
  if (failed.length) console.log('FAILED:', failed.map((f) => f.id).join(', '));
  console.log(`Saved ${path.join(EVIDENCE, 'auth-results.json')}`);
  console.log(`\nRESET_EMAIL=${resetEmail}`);
  console.log(`Password-reset token consumption is checked separately in run-auth-reset.mjs,`);
  console.log(`which reads the raw reset URL from the API's stdout log (RESEND_API_KEY is unset`);
  console.log(`locally, so MailService logs the link instead of sending it).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
