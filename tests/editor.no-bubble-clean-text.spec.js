// @ts-check
const { expect, test } = require('@playwright/test');
const { texts } = require('../fixtures/texts');
const { triggerEditorWithMouseSequence } = require('../support/actions/grammarlyActions');
const { expectGrammarlyBubbleAbsent } = require('../support/assertions/grammarlyBubbleAssertion');
const { attachDesktopScreenshot } = require('../support/evidence/desktopEvidence');
const { EditorPage } = require('../support/pages/editorPage');

test('should not show Grammarly bubble when user types correct text', async ({ page }, testInfo) => {
  const editorPage = new EditorPage(page);
  await editorPage.openTextarea();

  await expect(editorPage.textarea).toBeVisible();

  await editorPage.textarea.click();
  await page.keyboard.type(texts.clean, { delay: 75 });

  await page.waitForTimeout(500);
  await triggerEditorWithMouseSequence(page, editorPage.textarea);
  await page.waitForTimeout(2_000);

  await expect(editorPage.textarea).toHaveValue(texts.clean);
  await expectGrammarlyBubbleAbsent({ page, testInfo, editor: editorPage.textarea });

  await attachDesktopScreenshot(testInfo, 'no-bubble-clean-text');
});
