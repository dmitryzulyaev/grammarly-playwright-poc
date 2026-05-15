# Accessibility Strategy

The browser DOM and the Grammarly Desktop overlay are different layers.

Playwright can control the browser page: text fields, DOM nodes, keyboard input, and browser screenshots.

Grammarly Desktop may render its bubble and suggestion popup as macOS overlay UI outside the page DOM. For that layer, the preferred stable approach is macOS Accessibility, not screen coordinates.

## Current Decision

Use Playwright for browser content.

Use macOS Accessibility inspection for Grammarly Desktop UI if the bubble or popup appears in the accessibility tree.

Use screenshots only as evidence or fallback detection.

## First Check

Run `npm run ax:inspect` while Grammarly bubble is visible.

Look for entries related to Grammarly, suggestion, alert, button, popover, or menu. If the bubble is present there, we can automate it with Appium Mac2 or a smaller Accessibility helper.

If the bubble is not present in the tree, stable selector-based clicking is not available for that overlay. In that case the fallback options are image recognition or AI vision.

## Possible Next Tool

Appium Mac2 is the most test-framework-like option. It exposes macOS accessibility elements through WebDriver-style selectors and actions.

The lighter option is a custom helper around macOS Accessibility for only the Grammarly elements we need.
