// @ts-check
const { execFile } = require('node:child_process');
const { mkdtemp, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

/**
 * Captures the real macOS screen. This is needed because Grammarly Desktop can
 * render its bubble as an OS-level overlay outside the browser DOM.
 *
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} name
 */
async function attachDesktopScreenshot(testInfo, name) {
  const screenshot = await captureDesktopScreenshot();

  await testInfo.attach(name, {
    body: screenshot,
    contentType: 'image/png'
  });
}

async function captureDesktopScreenshot() {
  const dir = await mkdtemp(join(tmpdir(), 'grammarly-evidence-'));
  const path = join(dir, 'desktop.png');

  await execFilePromise('/usr/sbin/screencapture', ['-x', path]);

  return readFile(path);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} label
 */
async function attachDesktopBurst(page, testInfo, label) {
  for (let index = 0; index < 12; index += 1) {
    await page.waitForTimeout(index === 0 ? 0 : 250);
    await attachDesktopScreenshot(testInfo, `${label}-${index * 250}ms`);
  }
}

/**
 * @param {string} file
 * @param {string[]} args
 */
function execFilePromise(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve(undefined);
    });
  });
}

module.exports = {
  attachDesktopBurst,
  attachDesktopScreenshot,
  captureDesktopScreenshot
};
