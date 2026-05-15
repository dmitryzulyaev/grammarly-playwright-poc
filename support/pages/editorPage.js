// @ts-check

class EditorPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.textarea = page.locator('#editor');
  }

  async openTextarea() {
    await this.page.setContent(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Grammarly Browser Integration</title>
          <style>
            body {
              margin: 0;
              padding: 72px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f6f7f8;
              color: #17202a;
            }
            label {
              display: block;
              margin-bottom: 12px;
              font-size: 18px;
              font-weight: 650;
            }
            textarea {
              box-sizing: border-box;
              width: 760px;
              height: 260px;
              padding: 20px;
              border: 1px solid #aeb7c2;
              border-radius: 8px;
              background: white;
              color: #101820;
              font-size: 20px;
              line-height: 1.5;
              resize: none;
              outline: none;
            }
            textarea:focus {
              border-color: #117f6b;
              box-shadow: 0 0 0 3px rgba(17, 127, 107, 0.16);
            }
          </style>
        </head>
        <body>
          <label for="editor">Test editor</label>
          <textarea id="editor" autocomplete="off" spellcheck="true"></textarea>
        </body>
      </html>
    `);
  }
}

module.exports = { EditorPage };
