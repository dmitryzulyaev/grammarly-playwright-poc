// @ts-check
const { expect, test } = require('@playwright/test');
const { texts } = require('../fixtures/texts');
const {
  clickAcceptButton,
  clickVisibleGrammarlyBubble,
  typeTextAndTriggerBubble
} = require('../support/actions/grammarlyActions');
const { attachDesktopScreenshot } = require('../support/evidence/desktopEvidence');
const {
  expectGrammarlyBubbleVisible,
  expectGrammarlyBubbleAbsent
} = require('../support/assertions/grammarlyBubbleAssertion');
const { EditorPage } = require('../support/pages/editorPage');

test('should keep bubble visible after applying only one of two suggestions', async ({ page }, testInfo) => {
  const editorPage = new EditorPage(page);
  await editorPage.openTextarea();

  await expect(editorPage.textarea).toBeVisible();

  // Крок 1: надрукувати текст з двома помилками
  await typeTextAndTriggerBubble({
    page,
    editor: editorPage.textarea,
    text: texts.twoIssues
  });

  await expect(editorPage.textarea).toHaveValue(texts.twoIssues);
  await expectGrammarlyBubbleVisible({ page, editor: editorPage.textarea, testInfo });

  // Крок 2: клікнути бабл і застосувати першу suggestion
  await page.waitForTimeout(500);
  await clickVisibleGrammarlyBubble(page, testInfo, editorPage.textarea);
  await page.waitForTimeout(1_000);

  await attachDesktopScreenshot(testInfo, 'popup-opened');
  await clickAcceptButton(page, testInfo);
  await page.waitForTimeout(1_500);

  await attachDesktopScreenshot(testInfo, 'after-first-accept');

  // Крок 3: текст змінився (перша помилка виправлена)
  await expect(editorPage.textarea).not.toHaveValue(texts.twoIssues);

  // Крок 4: друга помилка залишилась у тексті
  const textAfterFix = await editorPage.textarea.inputValue();
  expect(textAfterFix, 'second error should still be in the text').toContain('sentense');

  // Крок 5: бабл залишається видимим (є ще одна помилка)
  await expectGrammarlyBubbleVisible({ page, editor: editorPage.textarea, testInfo });

  await attachDesktopScreenshot(testInfo, 'bubble-still-visible');
});
