// @ts-check
/**
 * Diagnostic: check if Grammarly Desktop attaches to contenteditable elements.
 * Not a pass/fail test — inspect the HTML report after running.
 *
 * Run: npx playwright test tests/diag/contenteditable.diag.js --headed
 */
const { test } = require('@playwright/test');
const { texts } = require('../../fixtures/texts');
const { typeTextAndTriggerBubble } = require('../../support/actions/grammarlyActions');
const { attachDesktopBurst, attachDesktopScreenshot } = require('../../support/evidence/desktopEvidence');
const { EditorPage } = require('../../support/pages/editorPage');

class ContentEditablePage {
  constructor(page) {
    this.page = page;
    this.editor = page.locator('#editor');
  }

  async open() {
    await this.page.setContent(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Grammarly Browser Integration — contenteditable</title>
          <style>
            body { margin: 0; padding: 72px; font-family: -apple-system, sans-serif; background: #f6f7f8; }
            label { display: block; margin-bottom: 12px; font-size: 18px; font-weight: 650; }
            #editor {
              box-sizing: border-box;
              width: 760px;
              min-height: 260px;
              padding: 20px;
              border: 1px solid #aeb7c2;
              border-radius: 8px;
              background: white;
              font-size: 20px;
              line-height: 1.5;
              outline: none;
            }
            #editor:focus { border-color: #117f6b; box-shadow: 0 0 0 3px rgba(17,127,107,0.16); }
          </style>
        </head>
        <body>
          <label for="editor">Test editor (contenteditable)</label>
          <div id="editor" contenteditable="true" spellcheck="true"></div>
        </body>
      </html>
    `);
  }
}

class InputPage {
  constructor(page) {
    this.page = page;
    this.editor = page.locator('#editor');
  }

  async open() {
    await this.page.setContent(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Grammarly Browser Integration — input</title>
          <style>
            body { margin: 0; padding: 72px; font-family: -apple-system, sans-serif; background: #f6f7f8; }
            label { display: block; margin-bottom: 12px; font-size: 18px; font-weight: 650; }
            #editor {
              box-sizing: border-box;
              width: 760px;
              padding: 16px 20px;
              border: 1px solid #aeb7c2;
              border-radius: 8px;
              background: white;
              font-size: 20px;
              outline: none;
            }
            #editor:focus { border-color: #117f6b; }
          </style>
        </head>
        <body>
          <label for="editor">Test editor (input type=text)</label>
          <input id="editor" type="text" autocomplete="off" spellcheck="true" />
        </body>
      </html>
    `);
  }
}

test.describe('DIAG: editor types', () => {
  test('contenteditable — does Grammarly bubble appear?', async ({ page }, testInfo) => {
    const editorPage = new ContentEditablePage(page);
    await editorPage.open();

    await editorPage.editor.click();
    await page.keyboard.type(texts.twoIssues, { delay: 75 });
    await page.waitForTimeout(500);

    // Спробувати тригернути мишею як і для textarea
    const box = await editorPage.editor.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + 40);
      await page.waitForTimeout(300);
      await page.mouse.click(box.x + 80, box.y + box.height - 50);
      await page.waitForTimeout(300);
      await page.mouse.click(box.x + box.width / 2, box.y + 42);
    }

    await page.waitForTimeout(2_000);

    // Burst — подивитись чи з'явився бабл
    await attachDesktopBurst(page, testInfo, 'contenteditable');

    test.info().annotations.push({ type: 'diagnostic', description: 'Check if Grammarly bubble visible' });
  });

  test('input[type=text] — does Grammarly bubble appear?', async ({ page }, testInfo) => {
    const editorPage = new InputPage(page);
    await editorPage.open();

    await editorPage.editor.click();
    // input не підтримує довгий текст з пробілами добре, беремо коротше
    await page.keyboard.type('She go to school.', { delay: 75 });
    await page.waitForTimeout(500);

    const box = await editorPage.editor.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
      await page.mouse.click(box.x + 80, box.y + box.height / 2);
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(2_000);

    await attachDesktopBurst(page, testInfo, 'input-type-text');

    test.info().annotations.push({ type: 'diagnostic', description: 'Check if Grammarly bubble visible' });
  });
});
