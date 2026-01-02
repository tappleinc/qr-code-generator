import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'os';
import { join } from 'path';

// Centralized temp directory for Playwright artifacts
// Note: Defined here (not imported from scripts/temp-paths.mjs) because
// TypeScript can't easily import .mjs modules. Keep in sync manually.
const TEMP_PLAYWRIGHT_DIR = join(tmpdir(), 'tapple-qr-playwright');

/**
 * Playwright configuration for browser e2e tests
 * Tests the dist/browser.mjs bundle in a real browser environment
 */
export default defineConfig({
  testDir: './test/dist',
  testMatch: '**/browser-e2e.test.ts',
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: 'list',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  // Store artifacts outside the repo in system temp directory
  outputDir: TEMP_PLAYWRIGHT_DIR,
  preserveOutput: 'never',

  webServer: {
    command: 'npx serve . -l 3000 --no-port-switching',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
