# Grammarly Playwright PoC

Playwright project for smoke-testing Grammarly Desktop integration with browser text editors on macOS.

## Scope

We test only the browser-editor flow:

1. Open a browser editor (HTML `<textarea>`).
2. Type text with mistakes.
3. Trigger Grammarly Desktop analysis.
4. Verify the Grammarly bubble appears / is absent / behaves correctly.
5. Apply suggestions and verify text changes.

Out of scope: installer, login, settings, Word, Mail, Slack, Google Docs, macOS permission automation.

## Prerequisites

- Grammarly Desktop installed, running, and signed in.
- Grammarly Desktop has macOS **Accessibility** permission.
- The terminal (or CI agent) running tests has **Screen Recording** permission.
- Node.js ≥ 18 and `cliclick` installed (`brew install cliclick`).

Install dependencies:

```bash
npm install
npx playwright install chromium
```

## Quick Start

```bash
npm run launch:grammarly   # open Grammarly Desktop
npm run preflight          # verify env (app installed, permissions, cliclick)
npm run smoke              # single bubble-visible smoke
npm run smoke:suite        # full 6-test smoke suite (sequential)
npm run report             # open Playwright HTML report
```

## Smoke Suite

```bash
npm run smoke:suite
```

Runs all six tests sequentially (`--workers=1`) so Grammarly always analyses the focused window:

| Script | Spec file | What it checks |
|---|---|---|
| `test:bubble` | `editor.bubble-visible.spec.js` | Bubble appears after typing text with mistakes |
| `test:suggestions` | `editor.suggestions-open.spec.js` | Suggestions popup opens on bubble click |
| `test:apply` | `editor.apply-suggestion.spec.js` | Applying a suggestion changes editor text |
| `test:no-bubble` | `editor.no-bubble-clean-text.spec.js` | No bubble appears for correct text |
| `test:manual-fix` | `editor.manual-fix.spec.js` | Bubble disappears after manually fixing all errors |
| `test:partial-fix` | `editor.bubble-persists-after-partial-fix.spec.js` | Bubble stays visible after fixing only one of two errors |

## Individual Test Scripts

```bash
npm run test:bubble        # bubble visible
npm run test:suggestions   # suggestions open
npm run test:apply         # apply suggestion
npm run test:no-bubble     # no bubble on clean text
npm run test:manual-fix    # manual fix hides bubble
npm run test:partial-fix   # partial fix keeps bubble
```

## Negative Smoke (app not installed)

```bash
npm run smoke:missing-app  # expects preflight to fail gracefully
```

## Diagnostics

```bash
npm run diag:popup         # observe popup layout and button positions
npm run diag:editors       # check which editor types Grammarly attaches to
npm run diag:all           # run all diagnostic specs
```

## Project Structure

```text
fixtures/
  texts.js                  — erroneous and clean text fixtures

support/
  actions/
    grammarlyActions.js     — type, trigger bubble, click bubble, click Accept
  assertions/
    grammarlyBubbleAssertion.js — expectGrammarlyBubbleVisible / Absent
  evidence/
    desktopEvidence.js      — attach desktop screenshots to Playwright report
  pages/
    editorPage.js           — page object for the test HTML editor
  system/
    grammarlyEnvironment.js — check/launch Grammarly process

tests/
  setup/
    grammarly.installed.setup.js   — preflight: app installed?
  editor.bubble-visible.spec.js
  editor.suggestions-open.spec.js
  editor.apply-suggestion.spec.js
  editor.no-bubble-clean-text.spec.js
  editor.manual-fix.spec.js
  editor.bubble-persists-after-partial-fix.spec.js
  diag/
    popup-layout.spec.js    — diagnostic: popup button layout
    contenteditable.spec.js — diagnostic: editor type compatibility

scripts/
  preflight.js              — env checks (app path, permissions, cliclick)
  inspect-accessibility.js  — dump macOS AX tree for a named app

docs/
  jamf-install-smoke.md
  install-uninstall-strategy.md
  browser-functional-test-plan.md
  accessibility-strategy.md
```

## Why Desktop Screenshots?

Grammarly Desktop renders its bubble and popup as macOS-level overlays outside the browser DOM. Playwright `page.screenshot()` misses them entirely. The framework uses macOS `screencapture -x` and pixel-detection (border tracing, teal-green cluster) to locate the bubble and Accept button, then clicks with `cliclick`.

## Test Structure Conventions

- One user behaviour per spec file.
- Test names use `should … when …`.
- Assertions stay in spec files so the Playwright report clearly shows what was verified.
- Helper modules perform actions only; they do not assert.
- Desktop screenshots are always attached as visual evidence.
