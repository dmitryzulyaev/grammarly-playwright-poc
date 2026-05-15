// @ts-check
const { expect, test } = require('@playwright/test');
const {
  appPath,
  isGrammarlyInstalled
} = require('../../support/system/grammarlyEnvironment');

test('should confirm Grammarly Desktop is installed', async () => {
  expect(isGrammarlyInstalled(), `${appPath} should exist`).toBe(true);
});
