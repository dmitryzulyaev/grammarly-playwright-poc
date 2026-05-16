// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 900 }
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.js/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-crash-reporter',
            '--disable-crashpad',
            '--disable-blink-features=AutomationControlled',
            '--window-position=0,0'
          ]
        }
      }
    }
  ],
  outputDir: 'test-results'
});
