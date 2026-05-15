// @ts-check
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');

const appPath = process.env.GRAMMARLY_APP_PATH || '/Applications/Grammarly Desktop.app';
const appName = 'Grammarly Desktop';

function isGrammarlyInstalled() {
  return existsSync(appPath);
}

function isGrammarlyRunning() {
  const result = execFileSync('/usr/bin/osascript', [
    '-e',
    `application "${appName}" is running`
  ], { encoding: 'utf8' });

  return result.trim() === 'true';
}

function launchGrammarly() {
  execFileSync('/usr/bin/open', ['-a', appName], { stdio: 'ignore' });
}

async function waitForGrammarlyToRun(timeoutMs = 15_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (isGrammarlyRunning()) {
      return true;
    }

    await delay(500);
  }

  return false;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  appName,
  appPath,
  isGrammarlyInstalled,
  isGrammarlyRunning,
  launchGrammarly,
  waitForGrammarlyToRun
};
