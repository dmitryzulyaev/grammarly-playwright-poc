# Work Summary Email

**To:** [Recruiter Name], [Hiring Manager Name]
**Subject:** QA Automation Task Completed — Grammarly Desktop Browser Integration

---

Dear [Recruiter Name] and [Hiring Manager Name],

I am writing to share the results of the QA automation task I completed for Grammarly Desktop's browser integration.

## Overview

The primary challenge was that Grammarly Desktop renders its bubble and suggestion popup as macOS-level overlays — entirely outside the browser DOM and inaccessible via standard Playwright selectors, CSS queries, or the macOS Accessibility API. No public solutions existed for this problem.

To address this, I designed and implemented a custom pixel-detection engine that captures the full macOS screen, locates the Grammarly UI elements via BFS flood-fill and color-cluster algorithms, and performs system-level interactions using `cliclick`. The solution requires no third-party image libraries and is built entirely on Node.js with built-in modules.

## Deliverables

**Smoke Test Suite — 6 automated tests**

| Test | Scenario Covered |
|---|---|
| `editor.bubble-visible` | Grammarly bubble appears after typing text with mistakes |
| `editor.suggestions-open` | Suggestions popup opens when user clicks the bubble |
| `editor.apply-suggestion` | Applying a suggestion correctly updates the editor text |
| `editor.no-bubble-clean-text` | No bubble appears for grammatically correct text |
| `editor.manual-fix` | Bubble disappears after the user manually corrects all errors |
| `editor.bubble-persists-after-partial-fix` | Bubble remains visible when only one of two errors is fixed |

**CI/CD Pipeline**

Tests run automatically via GitHub Actions on a self-hosted macOS runner:
- Triggered on every push and scheduled daily at 8:00 AM (Monday–Friday)
- Playwright HTML report with desktop screenshot evidence uploaded as an artifact on every run
- Notable finding during CI setup: Grammarly Desktop only attaches to the system-installed Google Chrome, not Playwright's bundled Chromium — resolved by setting `channel: 'chrome'` in the Playwright configuration

**Repository**

https://github.com/dmitryzulyaev/grammarly-playwright-poc

## Additional Work in Progress

I have also prepared a test plan covering the full Grammarly Desktop browser integration flow, as well as a release management strategy for weekly feature releases. I would be happy to present and discuss both in detail.

## Availability

I am available for a call or meeting at your convenience to walk through the implementation, discuss the approach, and answer any questions.

Thank you for the opportunity. I look forward to your feedback.

Sincerely,
Dmytro Ziuliaiev
dmytro.ziuliaiev@gmail.com
https://github.com/dmitryzulyaev
