// @ts-check
const { expect, test } = require('@playwright/test');
const { texts } = require('../fixtures/texts');
const { clickVisibleGrammarlyBubble, typeTextAndTriggerBubble } = require('../support/actions/grammarlyActions');
const { expectGrammarlyBubbleVisible, expectGrammarlySuggestionsVisible } = require('../support/assertions/grammarlyBubbleAssertion');
const { attachDesktopScreenshot } = require('../support/evidence/desktopEvidence');
const { EditorPage } = require('../support/pages/editorPage');

test('should open suggestions when user clicks Grammarly bubble', async ({ page }, testInfo) => {
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

  await page.waitForTimeout(1_000);
  await clickVisibleGrammarlyBubble(page, testInfo, editorPage.textarea);
  await page.waitForTimeout(1_500);

  await attachDesktopScreenshot(testInfo, 'suggestions-opened');
  await expectGrammarlySuggestionsVisible({ page, testInfo });
});
