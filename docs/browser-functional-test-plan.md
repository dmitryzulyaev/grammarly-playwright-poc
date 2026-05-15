# Browser Functional Test Plan

The browser tests should prove real user value, not only produce screenshots.

## Test 1: Grammarly Bubble Appears

User action:

```text
Type text with mistakes in a browser editor.
```

Assertions:

- The editor is visible.
- The typed text is present in the editor.
- The Grammarly bubble is detected in a desktop screenshot.

Status: implemented.

## Test 2: Suggestions Popup Opens

User action:

```text
Click the Grammarly bubble.
```

Assertions:

- The editor still contains the original text.
- A desktop screenshot is attached showing the suggestions popup.
- Next improvement: add image detection for the popup, similar to the bubble detector.

Status: partially implemented.

## Test 3: First Suggestion Is Applied

User action:

```text
Click the first suggestion in the Grammarly popup.
```

Assertions:

- The editor text changes.
- The editor no longer contains the original typo text.
- Optional: assert the corrected text when the suggestion is stable.

Status: planned, currently skipped until click coordinates are tuned.

## Negative Scenario: Grammarly Is Not Installed

Goal:

```text
Prove the suite does not produce false positives when Grammarly is missing.
```

Safe command:

```bash
npm run smoke:missing-app
```

Expected result:

- Setup test fails.
- Browser smoke test does not run.

This avoids uninstalling Grammarly from the local Mac.

## Install and Uninstall

Installation and uninstallation should be separate from browser functional tests.

Recommended approach:

- Jamf/deployment job installs Grammarly.
- Playwright setup verifies Grammarly exists.
- Browser smoke verifies Grammarly works in the editor.
- Uninstall is opt-in only and should run on a disposable test machine.
