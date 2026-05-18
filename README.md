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

## CI / CD

Tests run automatically via **GitHub Actions** on a self-hosted macOS runner.

| Trigger | What runs |
|---|---|
| Every `git push` | Full smoke suite + negative tests |
| Daily at **8:00 AM** Mon–Fri | Full smoke suite |

```yaml
# .github/workflows/smoke.yml
on:
  push:
  schedule:
    - cron: '0 8 * * 1-5'
```

**Self-hosted runner requirement:** Grammarly Desktop only attaches to the system-installed Google Chrome (not Playwright's bundled Chromium). Tests require an active macOS user session with display — headless mode is not supported.

On every CI run, a **Playwright HTML report** with desktop screenshot evidence is uploaded as a build artifact.

---

## Test Coverage

### Automated — Smoke Suite (6 tests, P1)

| ID | Test | What it verifies |
|---|---|---|
| SM-01 | `editor.bubble-visible` | Bubble appears after typing text with errors |
| SM-02 | `editor.suggestions-open` | Suggestion popup opens on bubble click |
| SM-03 | `editor.apply-suggestion` | Applying a suggestion updates editor text |
| SM-04 | `editor.no-bubble-clean-text` | No bubble for grammatically correct text |
| SM-05 | `editor.manual-fix` | Bubble disappears after all errors are manually fixed |
| SM-06 | `editor.bubble-persists-after-partial-fix` | Bubble stays visible after fixing only one of two errors |

### Editor Compatibility — Manually Verified

| Editor type | Example | Result |
|---|---|---|
| `<textarea>` | Custom HTML test page | ✅ Pass |
| `contenteditable` | Reddit post editor | ✅ Pass |
| `input[type=text]` | Reddit title field | ✅ Pass |
| TinyMCE | fiddle.tiny.cloud | ✅ Pass |
| Quill | quilljs.com | ✅ Pass |

### Not Automated

| Scenario | Reason |
|---|---|
| Login / account setup | Requires credentials |
| macOS permission granting | Requires manual UI interaction |
| Visual regression of popup | OS-level overlay, no stable pixel signature |
| Performance / latency testing | Needs dedicated perf framework |

---

## Documentation

All project documentation is maintained in Google Docs:

- 📋 [Test Plan v2](https://docs.google.com/document/d/1nA9taGNRk2R8LTWADYra9dDPkg0MVCkCxxQ2W7Al0yI/edit)
- 🚀 [Release Management Plan](https://docs.google.com/document/d/1zRKfWauV_4Tjw4oHDU7z7Gn0smc7Gk6NfRse143HSjU/edit)
- 🐛 [Bug Reports](https://docs.google.com/document/d/1beqZb6qqKf8xaQQQM8gk_9DhyQ-YhLsogH8cnf4HCEI/edit)

---

## Why Desktop Screenshots?

Grammarly Desktop renders its bubble and popup as macOS-level overlays outside the browser DOM. Playwright `page.screenshot()` misses them entirely. The framework uses macOS `screencapture -x` and pixel-detection (border tracing, teal-green cluster) to locate the bubble and Accept button, then clicks with `cliclick`.

## Test Structure Conventions

- One user behaviour per spec file.
- Test names use `should … when …`.
- Assertions stay in spec files so the Playwright report clearly shows what was verified.
- Helper modules perform actions only; they do not assert.
- Desktop screenshots are always attached as visual evidence.
