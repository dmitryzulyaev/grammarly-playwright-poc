# Jamf Install Smoke

This project does not install Grammarly directly from Playwright.

For macOS, Grammarly documents enterprise deployment through Jamf. Treat Jamf deployment as an environment setup smoke, then run the Playwright browser integration tests.

## Goal

Verify that a Mac enrolled in Jamf can receive Grammarly Desktop and then pass the browser integration smoke.

## Preconditions

- Test Mac is enrolled in Jamf.
- Grammarly for Mac deployment exists in Jamf.
- Target user can sign in to Grammarly after install.
- Accessibility permission is granted to Grammarly Desktop.
- Screen Recording permission is granted to the terminal app that runs tests.

## Test Steps

1. Trigger the Grammarly deployment from Jamf.
2. Wait until `/Applications/Grammarly Desktop.app` exists.
3. Launch Grammarly Desktop.
4. Sign in, if required.
5. Grant Accessibility permission, if required.
6. Run local preflight:

```bash
cd /Users/dmytroz/Documents/GitHub/grammarly-playwright-poc
npm run launch:grammarly
npm run preflight
```

7. Run browser integration smoke:

```bash
npm run test:browser
```

8. Open the Playwright report:

```bash
npx playwright show-report --port 9324
```

## Expected Result

- Preflight passes.
- Playwright report contains evidence that the Grammarly bubble appears in the browser editor.
- Suggestion popup test either passes or provides useful desktop screenshot evidence for tuning the click position.

## Notes

- Jamf deployment itself is not a Playwright responsibility.
- Playwright starts after Grammarly is installed, running, and permitted by macOS.
- This separation keeps the test project focused on Grammarly browser integration rather than MDM setup.
