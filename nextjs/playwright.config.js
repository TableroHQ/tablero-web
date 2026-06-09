import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke test config.
 *
 * Prerequisites (the tests hit the real stack, not mocks):
 *   1. Backend up:  ../../tablero-platform $ ./run.sh start   (gateway on :8080)
 *   2. Seed data present (director/staff/customer accounts, the demo restaurant).
 * The Next.js dev server is started automatically (or reused if already running).
 *
 * Run:  npm run test:e2e        (headless)
 *       npm run test:e2e:ui     (interactive)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
