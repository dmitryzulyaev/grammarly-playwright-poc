// @ts-check
const { expect, test } = require('@playwright/test');
const { texts } = require('../fixtures/texts');
const {
  clickAcceptButton,
  clickVisibleGrammarlyBubble,
  typeTextAndTriggerBubble
} = require('../support/actions/grammarlyActions');
const { attachDesktopScreenshot } = require('../support/evidence/desktopEvidence');
const { expectGrammarlyBubbleVisible } = require('../support/assertions/grammarlyBubbleAssertion');
const { EditorPage } = require('../support/pages/editorPage');

test('should update editor text when user applies first suggestion', async ({ page }, testInfo) => {
  const editorPage = new EditorPage(page);
  await editorPage.openTextarea();

  await expect(editorPage.textarea).toBeVisible();

  await typeTextAndTriggerBubble({
    page,
    editor: editorPage.textarea,
    text: texts.twoIssues
  });

  await expect(editorPage.textarea).toHaveValue(texts.twoIssues);
  await expectGrammarlyBubbleVisible({
    page,
    editor: editorPage.textarea,
    testInfo
  });

  await page.waitForTimeout(500);
  await clickVisibleGrammarlyBubble(page, testInfo, editorPage.textarea);
  await page.waitForTimeout(1_000);

  await attachDesktopScreenshot(testInfo, 'popup-opened');
  await clickAcceptButton(page, testInfo);
  await page.waitForTimeout(1_000);

  await attachDesktopScreenshot(testInfo, 'after-accept');
  await expect(editorPage.textarea).not.toHaveValue(texts.twoIssues);
});
