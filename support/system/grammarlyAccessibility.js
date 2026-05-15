// @ts-check
const { execFile } = require('node:child_process');

/**
 * Tries to click the first suggestion in the Grammarly suggestions popup
 * using the macOS Accessibility API.
 *
 * Returns true if the click was performed, false if Grammarly popup windows
 * were not found in the AX tree (caller should fall back to screenshot-based click).
 */
async function clickFirstSuggestionViaAX() {
  const windowCount = await getGrammarlyWindowCount();
  if (windowCount < 2) {
    return false;
  }

  // Window 1 is typically the main Grammarly app; window 2+ are overlay popups.
  // Try each window beyond the first looking for a clickable button.
  for (let windowIndex = 2; windowIndex <= windowCount; windowIndex += 1) {
    try {
      await osascript(`
        tell application "System Events"
          tell process "Grammarly Desktop"
            click button 1 of window ${windowIndex}
          end tell
        end tell
      `);
      return true;
    } catch {
      // This window had no buttons or click failed — try the next one.
    }
  }

  return false;
}

/**
 * Reads suggestion button labels from the Grammarly popup via AX.
 * Returns an empty array when the popup is not accessible.
 *
 * @returns {Promise<string[]>}
 */
async function getSuggestionTexts() {
  const windowCount = await getGrammarlyWindowCount();
  if (windowCount < 2) {
    return [];
  }

  for (let windowIndex = 2; windowIndex <= windowCount; windowIndex += 1) {
    try {
      const raw = await osascript(`
        tell application "System Events"
          tell process "Grammarly Desktop"
            get name of every button of window ${windowIndex}
          end tell
        end tell
      `);
      const texts = raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (texts.length > 0) {
        return texts;
      }
    } catch {
      // Window not accessible — continue.
    }
  }

  return [];
}

/**
 * Returns the number of windows belonging to the Grammarly Desktop process.
 * Returns 0 when the process is not running or AX access is denied.
 *
 * @returns {Promise<number>}
 */
async function getGrammarlyWindowCount() {
  try {
    const raw = await osascript(`
      tell application "System Events"
        tell process "Grammarly Desktop"
          get count of windows
        end tell
      end tell
    `);
    return parseInt(raw.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Lists the titles of all Grammarly Desktop windows visible to the AX tree.
 * Useful for manual inspection / debugging.
 *
 * @returns {Promise<string[]>}
 */
async function listGrammarlyWindows() {
  try {
    const raw = await osascript(`
      tell application "System Events"
        tell process "Grammarly Desktop"
          get name of every window
        end tell
      end tell
    `);
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @param {string} script
 * @returns {Promise<string>}
 */
function osascript(script) {
  return new Promise((resolve, reject) => {
    execFile('/usr/bin/osascript', ['-e', script], (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

module.exports = {
  clickFirstSuggestionViaAX,
  getGrammarlyWindowCount,
  getSuggestionTexts,
  listGrammarlyWindows
};
