// @ts-check
const { expect, test } = require('@playwright/test');
const { texts } = require('../fixtures/texts');
const { triggerEditorWithMouseSequence, typeTextAndTriggerBubble } = require('../support/actions/grammarlyActions');
const { expectGrammarlyBubbleAbsent, expectGrammarlyBubbleVisible } = require('../support/assertions/grammarlyBubbleAssertion');
const { attachDesktopScreenshot } = require('../support/evidence/desktopEvidence');
const { EditorPage } = require('../support/pages/editorPage');

test('should hide bubble when user manually fixes all errors', async ({ page }, testInfo) => {
  const editorPage = new EditorPage(page);
  await editorPage.openTextarea();

  await expect(editorPage.textarea).toBeVisible();

  // Крок 1: надрукувати текст з помилками і дочекатись бабла
  await typeTextAndTriggerBubble({
    page,
    editor: editorPage.textarea,
    text: texts.twoIssues
  });

  await expect(editorPage.textarea).toHaveValue(texts.twoIssues);
  await expectGrammarlyBubbleVisible({ page, editor: editorPage.textarea, testInfo });

  await attachDesktopScreenshot(testInfo, 'bubble-before-fix');

  // Крок 2: вручну виправити весь текст (select all + type correct)
  await editorPage.textarea.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.type(texts.clean, { delay: 75 });

  await expect(editorPage.textarea).toHaveValue(texts.clean);

  // Крок 3: тригернути Grammarly щоб переаналізував текст
  await page.waitForTimeout(500);
  await triggerEditorWithMouseSequence(page, editorPage.textarea);
  await page.waitForTimeout(2_000);

  await attachDesktopScreenshot(testInfo, 'after-fix');

  // Крок 4: бабл має зникнути (перевіряємо тільки регіон поряд з редактором)
  await expectGrammarlyBubbleAbsent({ page, testInfo, editor: editorPage.textarea });
});
