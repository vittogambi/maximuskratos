import { defineConfig, devices } from '@playwright/test';

// MK_BROWSER_WEB=http://127.0.0.1:3010 runs against the audit stack (`npm run dev:audit`), which has its own
// build folders and database. Without it, Playwright uses the habitual dev servers on 3000 and 4000.
const auditWeb = process.env.MK_BROWSER_WEB;

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: auditWeb ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: auditWeb
    ? [
      {
        command: 'npm run dev:audit',
        url: `${auditWeb}/login`,
        reuseExistingServer: true,
        timeout: 180_000,
      },
    ]
    : [
      {
        command: process.env.CI ? 'npm run start -w @mk/api' : 'npm run dev:api',
        url: 'http://localhost:4000/health',
        reuseExistingServer: true,
        timeout: 120_000,
      },
      {
        command: process.env.CI ? 'npm run start -w @mk/web' : 'npm run dev:web',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
    ],
});
