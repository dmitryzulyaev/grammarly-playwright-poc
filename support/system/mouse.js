// @ts-check
const { execFile } = require('node:child_process');
const { existsSync } = require('node:fs');

const cliclickPaths = [
  '/opt/homebrew/bin/cliclick',
  '/usr/local/bin/cliclick'
];

/**
 * Performs a macOS-level mouse click.
 * Coordinates are absolute screen coordinates.
 *
 * @param {number} x
 * @param {number} y
 */
async function systemMouseClick(x, y) {
  const cliclickPath = findCliclick();
  if (cliclickPath) {
    await execFilePromise(cliclickPath, [`c:${Math.round(x)},${Math.round(y)}`]);
    return;
  }

  await execFilePromise('/usr/bin/osascript', [
    '-e',
    `tell application "System Events" to click at {${Math.round(x)}, ${Math.round(y)}}`
  ]);
}

/**
 * Converts Playwright viewport coordinates into macOS screen coordinates and clicks there.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} viewportX
 * @param {number} viewportY
 */
async function systemMouseClickInPage(page, viewportX, viewportY) {
  const screenPoint = await page.evaluate(({ x, y }) => {
    const chromeLeftBorder = (window.outerWidth - window.innerWidth) / 2;
    const chromeTopBorder = window.outerHeight - window.innerHeight - chromeLeftBorder;

    return {
      x: window.screenX + chromeLeftBorder + x,
      y: window.screenY + chromeTopBorder + y
    };
  }, { x: viewportX, y: viewportY });

  await systemMouseClick(screenPoint.x, screenPoint.y);
}

function findCliclick() {
  return cliclickPaths.find(path => existsSync(path));
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
  findCliclick,
  systemMouseClick,
  systemMouseClickInPage
};
