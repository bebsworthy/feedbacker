import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false, // Run tests sequentially for better debugging
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for predictable behavior
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30000, // 30 second timeout per test

  use: {
    baseURL: 'http://localhost:5555',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off', // Turn off video to speed up
    launchOptions: {
      slowMo: process.env.CI ? 0 : 250 // Increased slow motion for better visibility
    },
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 30000, // 30 seconds for navigation
    acceptDownloads: true // Enable download handling
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  webServer: {
    command: 'npm run dev -- --port 5555',
    cwd: '../demo',
    port: 5555,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
