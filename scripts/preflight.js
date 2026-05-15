// @ts-check
const {
  isGrammarlyInstalled,
  isGrammarlyRunning,
  launchGrammarly,
  waitForGrammarlyToRun
} = require('../support/system/grammarlyEnvironment');

const checks = [
  {
    name: 'Grammarly Desktop app is installed',
    run: () => isGrammarlyInstalled()
  },
  {
    name: 'Grammarly Desktop process is running',
    run: async () => {
      if (!isGrammarlyRunning()) {
        launchGrammarly();
      }

      return waitForGrammarlyToRun();
    }
  }
];

let hasFailure = false;

(async () => {
  for (const check of checks) {
    try {
      const passed = await check.run();
      console.log(`${passed ? 'PASS' : 'FAIL'} ${check.name}`);
      hasFailure = hasFailure || !passed;
    } catch (error) {
      console.log(`FAIL ${check.name}`);
      console.log(error instanceof Error ? error.message : String(error));
      hasFailure = true;
    }
  }

  if (hasFailure) {
    console.log('\nPreflight failed. Install and launch Grammarly Desktop before running browser tests.');
    process.exit(1);
  }

  console.log('\nPreflight passed. Grammarly Desktop is ready for browser integration tests.');
})();
