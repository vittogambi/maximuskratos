import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
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
