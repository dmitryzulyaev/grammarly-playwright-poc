# Test Plan — Grammarly Desktop Browser Integration

**Version:** 2.0
**Date:** 2026-05-17
**Author:** Dmytro Ziuliaiev
**Scope:** Grammarly Desktop macOS overlay in Google Chrome browser editor
**Status:** Draft

---

## 1. Objective

Verify that Grammarly Desktop correctly detects, analyzes, and suggests corrections for text typed in browser-based editors, and that the bubble and suggestion popup behave as expected across all key user scenarios.

**Success Criteria:** All smoke tests pass on every CI run. No P1 bugs open at release time.

---

## 2. Roles and Responsibilities

| Role | Responsibility | Owner |
|---|---|---|
| QA Engineer | Write and execute test cases, maintain automation | Dmytro Ziuliaiev |
| Dev Lead | Fix reported bugs, review test plan | TBD |
| Product Owner | Approve scope, sign off on release | TBD |
| CI Maintainer | Keep self-hosted runner healthy | Dmytro Ziuliaiev |

---

## 3. Scope

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

## 4. Test Environment

| Component | Details |
|---|---|
| OS | macOS (Apple Silicon) |
| Browser | Google Chrome (system-installed) |
| Grammarly | Desktop app, latest version, signed in |
| Permissions | Accessibility + Screen Recording granted |
| Tools | Playwright v1.56, Node.js ≥ 18, cliclick |
| CI | GitHub Actions self-hosted macOS runner |
| Repo | https://github.com/dmitryzulyaev/grammarly-playwright-poc |

---

## 5. Test Types and Strategy

| Type | Coverage | Automated | Trigger |
|---|---|---|---|
| Smoke | Core happy path — bubble + suggestions + apply | ✅ | Every push + daily 8:00 AM |
| Functional | All user scenarios | Partially | Weekly / on demand |
| Negative | No bubble on clean text, missing app | ✅ | Every push |
| Regression | Full suite after Grammarly or macOS update | ✅ via CI | On update |
| Exploratory | Edge cases, unusual inputs | Manual | Before release |

---

## 6. Test Cases

### 6.1 Smoke Suite (Automated)

| ID | Test Name | Precondition | Input | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|
| SM-01 | Bubble visible on error text | Grammarly running, Chrome focused | Text with grammar errors | Grammarly bubble appears near editor | P1 | ✅ Automated |
| SM-02 | Suggestions popup opens | SM-01 passed, bubble visible | Click bubble | Suggestion popup appears on screen | P1 | ✅ Automated |
| SM-03 | Apply suggestion updates text | SM-02 passed, popup open | Click Accept | Editor text changes, original error removed | P1 | ✅ Automated |
| SM-04 | No bubble on clean text | Grammarly running, Chrome focused | Grammatically correct text | No bubble appears near editor | P1 | ✅ Automated |
| SM-05 | Bubble disappears after manual fix | SM-01 passed, bubble visible | Select all + type correct text | Bubble disappears after re-analysis | P2 | ✅ Automated |
| SM-06 | Bubble persists after partial fix | SM-01 passed, two errors in text | Apply first suggestion only | Bubble remains visible | P2 | ✅ Automated |

---

### 6.2 Functional Tests

#### Bubble Behavior

| ID | Test Case | Precondition | Expected Result | Priority | Severity |
|---|---|---|---|---|---|
| FB-01 | Bubble appears within 5 seconds of typing | Grammarly running | Bubble visible within 5s | P1 | Critical |
| FB-02 | Bubble position is adjacent to the editor | Bubble visible | Bubble within 300px of editor right edge | P1 | Major |
| FB-03 | Bubble disappears when editor loses focus | Bubble visible | Bubble hidden on focus loss | P2 | Minor |
| FB-04 | Bubble reappears when editor regains focus | FB-03 passed | Bubble reappears on focus | P2 | Minor |
| FB-05 | Bubble updates count when new errors added | Bubble visible with 1 error | Count increases to 2 | P2 | Major |
| FB-06 | Bubble shows correct number of issues | Text with 3 errors | Bubble shows 3 | P2 | Major |
| FB-07 | Bubble does not appear outside editor region | Grammarly running | No bubble on random screen areas | P1 | Major |

#### Suggestion Popup

| ID | Test Case | Precondition | Expected Result | Priority | Severity |
|---|---|---|---|---|---|
| SP-01 | Popup shows correct suggestion text | Popup open | Suggestion matches expected fix | P1 | Critical |
| SP-02 | Clicking Accept applies the suggestion | Popup open | Editor text updated correctly | P1 | Critical |
| SP-03 | Clicking Dismiss closes the popup | Popup open | Popup closes, bubble still visible | P1 | Major |
| SP-04 | Popup closes when clicking outside | Popup open | Popup closes | P2 | Minor |
| SP-05 | Multiple suggestions cycle correctly | Text with 3 errors | Each Accept moves to next error | P2 | Major |
| SP-06 | Popup does not overlap editor text | Popup open | Popup positioned outside textarea | P3 | Minor |

#### Text Analysis

| ID | Test Case | Input | Expected Result | Priority | Severity |
|---|---|---|---|---|---|
| TA-01 | Grammar error detected | "She go to school" | Bubble appears, suggests "goes" | P1 | Critical |
| TA-02 | Spelling error detected | "sentense" | Bubble appears, suggests "sentence" | P1 | Critical |
| TA-03 | Punctuation error detected | Missing comma | Bubble appears | P2 | Major |
| TA-04 | Clean text produces no bubble | Correct sentence | No bubble | P1 | Critical |
| TA-05 | Mixed language text | Ukrainian + English | Handled gracefully, no crash | P3 | Minor |
| TA-06 | Very long text (1000+ words) | 1000-word text | Analysis completes within 10s | P2 | Major |
| TA-07 | Empty textarea | No text | No bubble | P2 | Minor |
| TA-08 | Pasted text (Cmd+V) | Paste erroneous text | Bubble appears after paste | P2 | Major |

#### Editor Compatibility

| ID | Test Case | Precondition | Expected Result | Priority |
|---|---|---|---|---|
| EC-01 | `<textarea>` — Grammarly attaches | Grammarly running | Bubble appears | P1 |
| EC-02 | `contenteditable` div | Grammarly running | Document behavior | P2 |
| EC-03 | `input[type=text]` | Grammarly running | Document behavior | P2 |
| EC-04 | Rich text editor (TinyMCE, Quill) | Grammarly running | Document behavior | P3 |

---

### 6.3 Negative Tests

| ID | Test Case | Precondition | Expected Result | Priority | Status |
|---|---|---|---|---|---|
| NT-01 | Grammarly Desktop not installed | App removed | Preflight fails with clear message | P1 | ✅ Automated |
| NT-02 | Grammarly Desktop not running | App stopped | Setup test fails with message | P1 | ✅ Automated |
| NT-03 | No Accessibility permission | Permission revoked | Bubble does not appear, graceful failure | P1 | Manual |
| NT-04 | No Screen Recording permission | Permission revoked | `screencapture` fails with error message | P1 | Manual |
| NT-05 | Browser not focused | Another app in foreground | Bubble does not appear | P2 | Manual |

---

### 6.4 Regression Checklist (After Each Release)

Run after every Grammarly Desktop or macOS update:

- [ ] SM-01 through SM-06 all pass
- [ ] Bubble detection pixel thresholds still valid (color not changed)
- [ ] Accept button detection still valid (teal-green cluster)
- [ ] No new false positives from screen elements
- [ ] CI run passes on self-hosted runner
- [ ] `npm run preflight` passes on updated OS/Grammarly version

---

## 7. Test Data

| Variable | Value | Error Type |
|---|---|---|
| `texts.twoIssues` | `"She go to school every day. This sentense have a mistake."` | Grammar + Spelling |
| `texts.clean` | `"She goes to school every day. This sentence is correct."` | None |

**Gaps — planned additions:**

| Gap | Planned Test Data |
|---|---|
| Punctuation errors | `"Hello world how are you"` (missing comma) |
| Non-English text | `"Він іде до школи every day"` |
| Long-form text | 1000-word Lorem Ipsum with 5 injected errors |

---

## 8. Entry and Exit Criteria

### Entry Criteria (before running tests)
- Grammarly Desktop installed, running, and signed in
- Accessibility + Screen Recording permissions granted
- `cliclick` installed (`brew install cliclick`)
- Google Chrome installed
- `npm run preflight` passes with no errors

### Exit Criteria (test run complete)
- All SM-* (P1) tests pass
- No P1 bugs open
- 0 unexpected failures in CI
- Playwright HTML report generated with desktop screenshot evidence
- All known failures documented in bug tracker

---

## 9. Defect Management

### Severity Definitions

| Severity | Definition | Example |
|---|---|---|
| Critical | Feature completely broken, no workaround | Bubble never appears |
| Major | Feature broken in key scenario, workaround exists | Bubble appears but Accept button not found |
| Minor | Feature partially broken, low impact | Bubble appears slightly outside expected region |
| Trivial | Cosmetic or negligible issue | Bubble animation slightly delayed |

### Priority Definitions

| Priority | Definition |
|---|---|
| P1 | Must fix before release |
| P2 | Fix in current sprint if possible |
| P3 | Fix in next sprint |
| P4 | Nice to have |

### Bug Report Template

```
Title: [Component] Short description
Severity: Critical / Major / Minor / Trivial
Priority: P1 / P2 / P3 / P4
Environment: macOS version, Chrome version, Grammarly version
Steps to reproduce:
  1.
  2.
Expected result:
Actual result:
Evidence: [Playwright report link / screenshot]
```

---

## 10. Test Metrics and KPIs

| Metric | Target | Measurement |
|---|---|---|
| Smoke pass rate | 100% | CI daily run |
| Automation coverage (smoke) | 100% of P1 scenarios | Manual count |
| Bug detection rate | Track per sprint | Bug tracker |
| Mean time to detect regression | < 24h | CI schedule |
| Flaky test rate | < 5% | CI history |

---

## 11. Test Schedule

| Phase | Activity | When |
|---|---|---|
| Daily | Smoke suite via CI | 8:00 AM Mon–Fri |
| Per push | Smoke + negative tests | On every git push |
| Weekly | Full functional manual exploratory | Friday |
| Per Grammarly update | Full regression checklist | Within 24h of update |
| Per macOS update | Regression + environment check | Within 48h of update |
| Pre-release | Full suite + exploratory | 2 days before release |

---

## 12. Known Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| Pixel detection brittle to UI changes | High — Grammarly update may break detection | Monitor CI daily, update thresholds after updates |
| Tests require active macOS display | High — no headless support | Self-hosted runner with active user session |
| Only `<textarea>` confirmed working | Medium — other editor types untested | Diagnostic tests in `tests/diag/` |
| `cliclick` coordinates depend on DPI | Medium — only tested on Retina display | DPR detection via `getMacOsScreenLogicalWidth()` |
| Grammarly analysis timing varies | Low — bubble may appear after 1–4 seconds | Retry loop with 16 attempts × 250ms |

---

## 13. Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Grammarly Desktop update changes bubble UI | High | High | Run smoke on every Grammarly update |
| macOS update changes `screencapture` behavior | Low | High | Test after every OS update |
| Runner Mac goes to sleep | Medium | High | Disable sleep, use `caffeinate` |
| Grammarly session expires (signed out) | Medium | High | Monitor CI failures, manual re-login |
| CI runner offline | Low | High | Alert on CI failure, manual restart |

---

## 14. Out of Scope for Automation

| Scenario | Why Not Automated |
|---|---|
| Login / account setup | Requires credentials, not safe to automate |
| Grammarly settings changes | Out of scope for browser integration |
| Performance testing (bubble latency) | Needs dedicated perf framework |
| Visual regression of popup layout | Popup is OS-level, no stable pixel signature |
| Permission granting | Requires manual macOS UI interaction |

---

## 15. Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| QA Engineer | Dmytro Ziuliaiev | | |
| Dev Lead | | | |
| Product Owner | | | |
