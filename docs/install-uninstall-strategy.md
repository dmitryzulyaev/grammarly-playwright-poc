# Install and Uninstall Strategy

This project separates environment setup from browser integration tests.

## Current Approach

The Playwright suite has a setup project:

```text
setup/grammarly-preflight.setup.js
```

It checks:

- Grammarly Desktop is installed in `/Applications`.

If this setup test fails, the browser tests do not run.

## Why Not Install From Playwright?

Installing Grammarly on macOS is environment setup, not browser behavior. It can require:

- Jamf or another MDM tool.
- DMG handling.
- User sign-in.
- Accessibility permission.
- Possible admin prompts.

Keeping this outside the browser tests makes failures easier to understand.

## Recommended Layers

### Layer 1: Deployment Smoke

Owner: Jamf / IT setup.

Goal:

```text
Grammarly Desktop is installed on the Mac.
```

Expected result:

```text
/Applications/Grammarly Desktop.app exists
```

### Layer 2: Local Preflight

Owner: this Playwright project.

Goal:

```text
Grammarly Desktop is installed.
```

Run:

```bash
npm run preflight
```

### Layer 3: Browser Integration Tests

Owner: this Playwright project.

Goal:

```text
Grammarly Desktop detects mistakes in a browser editor.
```

Run:

```bash
npm run test:browser
```

## Future Install Test

If we later automate installation, create a separate script or CI job:

```text
setup/install-grammarly-mac.sh
```

That job should:

1. Download or receive the approved Grammarly installer.
2. Install Grammarly through Jamf or a controlled DMG flow.
3. Launch Grammarly.
4. Stop before sign-in/permissions if those require manual or MDM-managed approval.
5. Run `npm run preflight`.

## Future Uninstall Test

Uninstall is destructive and should not run as part of normal browser tests.

If needed, create a separate opt-in job:

```text
setup/uninstall-grammarly-mac.sh
```

That job should:

1. Quit Grammarly Desktop.
2. Remove the app.
3. Remove support files only in a disposable test account.
4. Verify `/Applications/Grammarly Desktop.app` no longer exists.

Do not run uninstall on a personal or shared machine by default.
