# Test Plan — Grammarly Desktop Browser Integration

**Version:** 1.0  
**Date:** 2026-05-17  
**Author:** Dmytro Ziuliaiev  
**Scope:** Grammarly Desktop macOS overlay in Google Chrome browser editor

---

## 1. Objective

Verify that Grammarly Desktop correctly detects, analyzes, and suggests corrections for text typed in browser-based editors, and that the bubble and suggestion popup behave as expected across all key user scenarios.

---

## 2. Scope

### In Scope
- Grammarly Desktop overlay in Google Chrome (`<textarea>` editors)
- Bubble appearance, positioning, and interaction
- Suggestion popup — open, apply, dismiss
- Text analysis — grammar errors, spelling errors, clean text
- Partial and full error correction flows
- macOS + Chrome integration behavior

### Out of Scope
- Grammarly Web App (grammarly.com)
- Browser extension (separate product)
- Non-browser apps (Word, Mail, Slack, Google Docs native)
- Grammarly account management, login, settings
- Windows platform
- Firefox, Safari, Edge browsers
- Mobile (iOS, Android)

---

## 3. Test Environment

| Component | Details |
|---|---|
| OS | macOS (Apple Silicon) |
| Browser | Google Chrome (system-installed) |
| Grammarly | Desktop app, latest version, signed in |
| Permissions | Accessibility + Screen Recording granted |
| Tools | Playwright, Node.js ≥ 18, cliclick |
| CI | GitHub Actions self-hosted macOS runner |

---

## 4. Test Types

| Type | Coverage | Automated |
|---|---|---|
| Smoke | Core happy path — bubble + suggestions + apply | ✅ |
| Functional | All user scenarios | Partially |
| Negative | No bubble on clean text, missing app | ✅ |
| Regression | Run after every release | ✅ via CI |
| Exploratory | Edge cases, unusual inputs | Manual |

---

## 5. Test Cases

### 5.1 Smoke Suite (Automated)

| ID | Test Name | Input | Expected Result | Status |
|---|---|---|---|---|
| SM-01 | Bubble visible on error text | Text with grammar errors | Grammarly bubble appears near editor | ✅ Automated |
| SM-02 | Suggestions popup opens | Click bubble | Suggestion popup appears on screen | ✅ Automated |
| SM-03 | Apply suggestion updates text | Click Accept | Editor text changes, original error removed | ✅ Automated |
| SM-04 | No bubble on clean text | Grammatically correct text | No bubble appears near editor | ✅ Automated |
| SM-05 | Bubble disappears after manual fix | Select all + type correct text | Bubble disappears after re-analysis | ✅ Automated |
| SM-06 | Bubble persists after partial fix | Two errors, fix one | Bubble remains visible | ✅ Automated |

---

### 5.2 Functional Tests (Manual + Automation Candidates)

#### Bubble Behavior

| ID | Test Case | Priority |
|---|---|---|
| FB-01 | Bubble appears within 5 seconds of typing | High |
| FB-02 | Bubble position is adjacent to the editor (not random screen location) | High |
| FB-03 | Bubble disappears when editor loses focus | Medium |
| FB-04 | Bubble reappears when editor regains focus | Medium |
| FB-05 | Bubble updates count when new errors are introduced | Medium |
| FB-06 | Bubble shows correct number of issues | Medium |
| FB-07 | Bubble does not appear outside editor region | High |

#### Suggestion Popup

| ID | Test Case | Priority |
|---|---|---|
| SP-01 | Popup shows correct suggestion text | High |
| SP-02 | Clicking Accept applies the suggestion | High |
| SP-03 | Clicking Dismiss closes the popup | High |
| SP-04 | Popup closes when clicking outside | Medium |
| SP-05 | Multiple suggestions cycle correctly | Medium |
| SP-06 | Popup position does not overlap editor text | Low |

#### Text Analysis

| ID | Test Case | Priority |
|---|---|---|
| TA-01 | Grammar error detected ("She go to school") | High |
| TA-02 | Spelling error detected ("sentense") | High |
| TA-03 | Punctuation error detected | Medium |
| TA-04 | Clean text produces no bubble | High |
| TA-05 | Mixed language text handled gracefully | Low |
| TA-06 | Very long text (1000+ words) analyzed | Medium |
| TA-07 | Empty textarea produces no bubble | Medium |
| TA-08 | Pasted text (Cmd+V) triggers analysis | Medium |

#### Editor Compatibility

| ID | Test Case | Priority |
|---|---|---|
| EC-01 | `<textarea>` — Grammarly attaches | High |
| EC-02 | `contenteditable` div — Grammarly behavior | Medium |
| EC-03 | `input[type=text]` — Grammarly behavior | Medium |
| EC-04 | Rich text editor (TinyMCE, Quill) — Grammarly behavior | Low |

---

### 5.3 Negative Tests

| ID | Test Case | Expected Result | Status |
|---|---|---|---|
| NT-01 | Grammarly Desktop not installed | Preflight fails with clear message | ✅ Automated (`smoke:missing-app`) |
| NT-02 | Grammarly Desktop not running | Setup test fails | ✅ Automated |
| NT-03 | No Accessibility permission | Grammarly bubble does not appear, test fails gracefully | Manual |
| NT-04 | No Screen Recording permission | `screencapture` fails with error | Manual |
| NT-05 | Browser is not focused | Bubble does not appear (Grammarly ignores unfocused windows) | Manual |

---

### 5.4 Regression Checklist (After Each Release)

Run after every Grammarly Desktop update:

- [ ] SM-01 through SM-06 all pass
- [ ] Bubble detection pixel thresholds still valid (color not changed)
- [ ] Accept button detection still valid (teal-green cluster)
- [ ] No new false positives from screen elements
- [ ] CI run passes on self-hosted runner

---

## 6. Test Data

| Variable | Value |
|---|---|
| `texts.twoIssues` | `"She go to school every day. This sentense have a mistake."` |
| `texts.clean` | Grammatically correct sentence |
| Error types covered | Subject-verb agreement, spelling |

**Gaps in test data:**
- Punctuation errors not covered
- Non-English text not covered
- Long-form text (500+ words) not covered

---

## 7. Entry and Exit Criteria

### Entry Criteria (before running tests)
- Grammarly Desktop installed, running, and signed in
- Accessibility + Screen Recording permissions granted
- `cliclick` installed
- Google Chrome installed
- `npm run preflight` passes

### Exit Criteria (test run complete)
- All SM-* tests pass
- 0 unexpected failures
- Playwright HTML report generated with screenshot evidence

---

## 8. Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Pixel detection brittle to UI changes | High — Grammarly update may break detection | Monitor CI daily, update thresholds after Grammarly updates |
| Tests require active macOS display | High — no headless support | Self-hosted runner with active user session |
| Only `<textarea>` confirmed working | Medium — other editor types untested | Diagnostic tests exist in `tests/diag/` |
| `cliclick` coordinates depend on DPI | Medium — only tested on Retina display | DPR detection via `getMacOsScreenLogicalWidth()` |
| Grammarly analysis timing varies | Low — bubble may appear after 1–4 seconds | Retry loop with 16 attempts × 250ms |

---

## 9. Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Grammarly Desktop update changes bubble UI | High | High | Run smoke on every Grammarly update |
| macOS update changes `screencapture` behavior | Low | High | Test after every OS update |
| Runner Mac goes to sleep | Medium | High | Disable sleep, use `caffeinate` |
| Grammarly session expires (signed out) | Medium | High | Monitor CI failures, manual re-login |

---

## 10. Out of Scope for Automation (Reason)

| Scenario | Why Not Automated |
|---|---|
| Login / account setup | Requires credentials, not safe to automate |
| Grammarly settings changes | Out of scope for browser integration |
| Performance testing (bubble latency) | Needs dedicated perf framework |
| Visual regression of suggestion popup layout | Popup is OS-level, no stable pixel signature |
