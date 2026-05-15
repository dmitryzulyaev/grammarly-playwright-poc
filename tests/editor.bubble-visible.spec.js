// @ts-check
const { expect, test } = require('@playwright/test');
const { texts } = require('../fixtures/texts');
const { typeTextAndTriggerBubble } = require('../support/actions/grammarlyActions');
const { expectGrammarlyBubbleVisible } = require('../support/assertions/grammarlyBubbleAssertion');
const { EditorPage } = require('../support/pages/editorPage');

test('should show Grammarly bubble when user types text with mistakes', async ({ page }, testInfo) => {
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
});
