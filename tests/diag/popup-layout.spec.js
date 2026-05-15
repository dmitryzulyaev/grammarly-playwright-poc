// @ts-check
/**
 * Diagnostic: observe Grammarly popup layout and Dismiss behavior.
 * Not a pass/fail test — inspect the HTML report after running.
 *
 * Run: npx playwright test tests/diag/popup-layout.diag.js --headed
 */
const { execFileSync } = require('node:child_process');
const { test } = require('@playwright/test');
const { texts } = require('../../fixtures/texts');
const { clickVisibleGrammarlyBubble, typeTextAndTriggerBubble } = require('../../support/actions/grammarlyActions');
const { expectGrammarlyBubbleVisible, findAcceptButton } = require('../../support/assertions/grammarlyBubbleAssertion');
const { attachDesktopBurst, attachDesktopScreenshot, captureDesktopScreenshot } = require('../../support/evidence/desktopEvidence');
const { systemMouseClick } = require('../../support/system/mouse');
const { EditorPage } = require('../../support/pages/editorPage');

function getScreenDpr() {
  try {
    const out = execFileSync('/usr/bin/osascript', [
      '-e', 'tell application "Finder"\nset b to bounds of window of desktop\nreturn (item 3 of b)\nend tell'
    ], { encoding: 'utf8', timeout: 3000 });
    const logicalW = parseInt(out.trim(), 10);
    if (logicalW > 0) {
      const shot = require('fs').readFileSync('/dev/null'); // placeholder
      return logicalW;
    }
  } catch { /* ignore */ }
  return 0;
}

test.describe('DIAG: popup layout + Dismiss', () => {
  test('observe popup with two issues — layout and Dismiss behavior', async ({ page }, testInfo) => {
    const editorPage = new EditorPage(page);
    await editorPage.openTextarea();

    await typeTextAndTriggerBubble({
      page,
      editor: editorPage.textarea,
      text: texts.twoIssues
    });

    await expectGrammarlyBubbleVisible({ page, editor: editorPage.textarea, testInfo });

    await page.waitForTimeout(500);
    await clickVisibleGrammarlyBubble(page, testInfo, editorPage.textarea);
    await page.waitForTimeout(1_000);

    // Burst щоб побачити повний layout попапу
    await attachDesktopBurst(page, testInfo, 'popup-layout');

    // Обчислюємо реальний DPR
    const shot = await captureDesktopScreenshot();
    const imgW = shot.readUInt32BE(16);
    let logicalScreenWidth;
    try {
      const out = execFileSync('/usr/bin/osascript', [
        '-e', 'tell application "Finder"\nset b to bounds of window of desktop\nreturn (item 3 of b)\nend tell'
      ], { encoding: 'utf8', timeout: 3000 });
      logicalScreenWidth = parseInt(out.trim(), 10) || Math.round(imgW / 2);
    } catch {
      logicalScreenWidth = Math.round(imgW / 2);
    }
    const screenDpr = imgW / logicalScreenWidth;

    const acceptBtn = findAcceptButton(shot);
    if (acceptBtn) {
      const acceptX = acceptBtn.centerX / screenDpr;
      const acceptY = acceptBtn.centerY / screenDpr;
      // Dismiss зазвичай знаходиться праворуч від Accept (~120 логічних пікселів)
      const dismissX = acceptX + 120;
      const dismissY = acceptY;

      console.log('[diag] Accept at logical (%.0f, %.0f)', acceptX, acceptY);
      console.log('[diag] Trying Dismiss at logical (%.0f, %.0f)', dismissX, dismissY);

      await attachDesktopScreenshot(testInfo, 'before-dismiss');
      await systemMouseClick(dismissX, dismissY);
      await page.waitForTimeout(500);
      await attachDesktopScreenshot(testInfo, 'immediately-after-dismiss');

      // 5 секунд щоб побачити чи бабл повертається
      await attachDesktopBurst(page, testInfo, 'after-dismiss');
    } else {
      console.log('[diag] Accept button not detected — check popup-layout screenshots');
      await attachDesktopScreenshot(testInfo, 'accept-not-found');
    }

    // Тест завжди "проходить" — це діагностика
    test.info().annotations.push({ type: 'diagnostic', description: 'Manual inspection required' });
  });
});
