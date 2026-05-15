// @ts-check
const { test, expect } = require('@playwright/test');
const {
  appName,
  isGrammarlyRunning,
  launchGrammarly,
  waitForGrammarlyToRun
} = require('../../support/system/grammarlyEnvironment');

test('should confirm Grammarly Desktop is running', async () => {
  if (isGrammarlyRunning()) {
    expect(isGrammarlyRunning(), `${appName} should be running`).toBe(true);
    return;
  }

  launchGrammarly();
  const started = await waitForGrammarlyToRun();
  expect(started, `${appName} should start within timeout`).toBe(true);
});
