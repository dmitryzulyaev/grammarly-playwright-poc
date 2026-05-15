// @ts-check
const { execFileSync } = require('node:child_process');
const { expect } = require('@playwright/test');
const { findGrammarlyBubble, findGrammarlyBubbleByBorder, findAcceptButton } = require('../assertions/grammarlyBubbleAssertion');
const { captureDesktopScreenshot } = require('../evidence/desktopEvidence');
const { systemMouseClick, systemMouseClickInPage } = require('../system/mouse');

/**
 * Returns the logical (Quartz-point) width of the primary macOS display.
 * window.screen.width inside Playwright is overridden to the viewport width,
 * so we ask macOS directly via osascript.
 *
 * @returns {number}
 */
function getMacOsScreenLogicalWidth() {
  try {
    const output = execFileSync('/usr/bin/osascript', [
      '-e', 'tell application "Finder"\nset b to bounds of window of desktop\nreturn (item 3 of b)\nend tell'
    ], { encoding: 'utf8', timeout: 3000 });
    const w = parseInt(output.trim(), 10);
    if (w > 0) return w;
  } catch {
    // fallback below
  }
  // Fallback: assume the screencapture width at DPR 2 → half the physical width.
  return 0;
}
/**
 * @param {object} options
 * @param {import('@playwright/test').Page} options.page
 * @param {import('@playwright/test').Locator} options.editor
 * @param {string} options.text
 */
async function typeTextAndTriggerBubble({ page, editor, text }) {
  await editor.click();

  // Use real key events. Grammarly Desktop may ignore direct value changes.
  await page.keyboard.type(text, { delay: 75 });

  // Grammarly Desktop shows the bubble only after an extra mouse click in the typed field.
  await page.waitForTimeout(500);
  await triggerEditorWithMouseSequence(page, editor);
  await page.waitForTimeout(2_000);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} editor
 */
async function clickInsideEditorWithMouse(page, editor) {
  const box = await editor.boundingBox();
  if (!box) {
    throw new Error('Editor bounding box was not available');
  }

  await page.mouse.move(box.x + box.width / 2, box.y + 40);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.up();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} editor
 */
async function triggerEditorWithMouseSequence(page, editor) {
  const box = await editor.boundingBox();
  if (!box) {
    throw new Error('Editor bounding box was not available');
  }

  await page.mouse.click(box.x + box.width - 70, box.y + 38);
  await page.waitForTimeout(400);
  await systemMouseClickInPage(page, box.x + 80, box.y + box.height - 50);
  await page.waitForTimeout(400);
  await systemMouseClickInPage(page, box.x + box.width / 2, box.y + 42);
}

/**
 * Returns the browser viewport bounds in physical screenshot pixels so that
 * bubble / button detection is restricted to the area Grammarly can overlay.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} imageWidth  physical width of the screencapture image
 * @param {number} imageHeight physical height of the screencapture image
 */
async function getBrowserRegion(page, imageWidth, imageHeight) {
  const info = await page.evaluate(() => {
    const dpr = window.devicePixelRatio || 1;
    const chromeLeft = (window.outerWidth - window.innerWidth) / 2;
    const chromeTop = window.outerHeight - window.innerHeight - chromeLeft;
    return {
      screenX: window.screenX,
      screenY: window.screenY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      chromeLeft,
      chromeTop,
      dpr,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  });

  const physLeft = (info.screenX + info.chromeLeft) * info.dpr;
  const physTop = (info.screenY + info.chromeTop) * info.dpr;
  const physRight = physLeft + info.innerWidth * info.dpr;
  const physBottom = physTop + info.innerHeight * info.dpr;

  return { left: physLeft, top: physTop, right: physRight, bottom: physBottom };
}

/**
 * Clicks the Grammarly bubble by detecting its dark circular border in a
 * screenshot region just to the right of the editor.  The bubble is a white
 * OS-level overlay; pixel coordinates are converted to logical screen points
 * via DPR so no window.screenX/Y arithmetic is needed at call time.
 *
 * When no editor is provided the function falls back to the legacy red-cluster
 * screenshot scan (kept for non-editor tests).
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {import('@playwright/test').Locator} [editor]
 */
async function clickVisibleGrammarlyBubble(page, testInfo, editor = null) {
  if (editor) {
    const editorBox = await editor.boundingBox();
    if (!editorBox) {
      throw new Error('Editor bounding box was not available');
    }

    // Compute the physical-pixel search region just to the right of the editor.
    //
    // IMPORTANT: window.devicePixelRatio inside Playwright is always 1 (Playwright
    // overrides it), but macOS screencapture produces images at the actual Retina
    // DPR (e.g. 2×).  We derive the real screen DPR by comparing the screenshot
    // pixel width against window.screen.width (logical CSS pixels).
    const info = await page.evaluate(() => {
      const chromeLeft = (window.outerWidth - window.innerWidth) / 2;
      const chromeTop = window.outerHeight - window.innerHeight - chromeLeft;
      return {
        screenX: window.screenX,
        screenY: window.screenY,
        chromeLeft,
        chromeTop,
        screenWidth: window.screen.width
      };
    });

    // Derive the real Retina DPR.  Both window.devicePixelRatio and
    // window.screen.width are overridden by Playwright (both return viewport
    // values), so we get the actual logical screen width from macOS directly.
    const firstShot = await captureDesktopScreenshot();
    const imgW = firstShot.readUInt32BE(16);
    const logicalScreenWidth = getMacOsScreenLogicalWidth() || Math.round(imgW / 2);
    const screenDpr = imgW / logicalScreenWidth;   // e.g. 3024 / 1512 = 2

    const editorRightPhys = Math.round(
      (info.screenX + info.chromeLeft + editorBox.x + editorBox.width) * screenDpr
    );
    const editorTopPhys = Math.round(
      (info.screenY + info.chromeTop + editorBox.y) * screenDpr
    );
    const editorBottomPhys = Math.round(editorTopPhys + editorBox.height * screenDpr);

    const searchRegion = {
      left: editorRightPhys + 5,
      right: editorRightPhys + 300,
      top: Math.max(0, editorTopPhys - 80),
      bottom: editorBottomPhys + 150
    };

    // Attach a labelled first shot for diagnostics.
    await testInfo.attach('bubble-click-target-0', {
      body: firstShot,
      contentType: 'image/png'
    });

    // Log coordinates so failures are diagnosable in the test report.
    console.log('[bubble-click] screenDpr=%s info=%j searchRegion=%j', screenDpr, info, searchRegion);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const screenshot = attempt === 0
        ? firstShot
        : await captureDesktopScreenshot();

      if (attempt > 0) {
        await testInfo.attach(`bubble-click-target-${attempt}`, {
          body: screenshot,
          contentType: 'image/png'
        });
      }

      const bubble = findGrammarlyBubbleByBorder(screenshot, searchRegion);
      console.log('[bubble-click] attempt=%d bubble=%j', attempt, bubble);
      if (!bubble) {
        await page.waitForTimeout(500);
        continue;
      }

      // Physical pixel → logical screen point (÷ actual screen DPR).
      const clickX = bubble.centerX / screenDpr;
      const clickY = bubble.centerY / screenDpr;
      console.log('[bubble-click] clicking at logical (%s, %s)', clickX, clickY);
      await systemMouseClick(clickX, clickY);
      await page.waitForTimeout(1_000);

      // Success if the bubble is now gone (popup opened) or Accept button visible.
      const checkShot = await captureDesktopScreenshot();
      await testInfo.attach(`after-click-${attempt}`, {
        body: checkShot,
        contentType: 'image/png'
      });
      const bubbleGone = !findGrammarlyBubbleByBorder(checkShot, searchRegion);
      if (findAcceptButton(checkShot) || bubbleGone) {
        return;
      }
    }

    throw new Error('Grammarly bubble was not found or click did not open suggestions popup');
  }

  // Legacy fallback: screenshot red-cluster scan (no editor provided).
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 0 : 250);

    const screenshot = await captureDesktopScreenshot();
    await testInfo.attach(`bubble-click-target-${attempt * 250}ms`, {
      body: screenshot,
      contentType: 'image/png'
    });

    const imgW = screenshot.readUInt32BE(16);
    const imgH = screenshot.readUInt32BE(20);
    const region = await getBrowserRegion(page, imgW, imgH);

    const bubble = findGrammarlyBubble(screenshot, region);
    if (!bubble) {
      continue;
    }

    const screen = await page.evaluate(() => ({
      x: window.screenX,
      y: window.screenY,
      width: window.screen.width,
      height: window.screen.height
    }));

    await systemMouseClick(
      screen.x + (bubble.centerX / bubble.imageWidth) * screen.width,
      screen.y + (bubble.centerY / bubble.imageHeight) * screen.height
    );
    return;
  }

  throw new Error('Grammarly bubble was not found on desktop screenshot');
}

/**
 * Finds and clicks the green Accept button in the Grammarly suggestions popup
 * by scanning desktop screenshots for the button's teal-green pixel cluster.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
async function clickAcceptButton(page, testInfo) {
  // Derive the real screen DPR once (same approach as clickVisibleGrammarlyBubble).
  const firstShot = await captureDesktopScreenshot();
  const imgW = firstShot.readUInt32BE(16);
  const logicalScreenWidth = getMacOsScreenLogicalWidth() || Math.round(imgW / 2);
  const screenDpr = imgW / logicalScreenWidth;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    await page.waitForTimeout(attempt === 0 ? 0 : 250);

    const screenshot = attempt === 0 ? firstShot : await captureDesktopScreenshot();
    await testInfo.attach(`accept-btn-check-${attempt * 250}ms`, {
      body: screenshot,
      contentType: 'image/png'
    });

    const button = findAcceptButton(screenshot);
    if (!button) {
      continue;
    }

    // Physical pixel → logical screen point (÷ actual screen DPR).
    // The screenshot covers the full display from (0,0), so dividing by DPR
    // gives absolute logical coordinates directly — no window-offset addition.
    const clickX = button.centerX / screenDpr;
    const clickY = button.centerY / screenDpr;
    console.log('[accept-click] screenDpr=%s button=%j clicking at logical (%s, %s)', screenDpr, button, clickX, clickY);
    await systemMouseClick(clickX, clickY);
    return;
  }

  throw new Error('Grammarly Accept button was not found on desktop screenshot');
}

module.exports = {
  clickAcceptButton,
  clickVisibleGrammarlyBubble,
  clickInsideEditorWithMouse,
  triggerEditorWithMouseSequence,
  typeTextAndTriggerBubble
};
