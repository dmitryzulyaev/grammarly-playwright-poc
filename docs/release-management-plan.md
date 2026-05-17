# Release Management Plan — Grammarly Desktop Browser Integration

**Version:** 1.0
**Date:** 2026-05-17
**Author:** Dmytro Ziuliaiev
**Release Cadence:** Weekly (every Friday)

---

## 1. Objective

Define the process for planning, testing, and releasing new features and fixes for Grammarly Desktop browser integration on a weekly cadence, ensuring quality and stability at every release.

---

## 2. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Product Owner | Approves features for release, signs off on release notes |
| Dev Lead | Code freeze decision, merge approvals |
| QA Engineer | Test execution, release sign-off, bug triage |
| DevOps / CI | Pipeline health, deployment |
| Release Manager | Coordinates release process, communicates status |

---

## 3. Weekly Release Cycle

### Monday
- Sprint planning — features and fixes scoped for the week
- QA reviews acceptance criteria for each ticket

### Tuesday - Wednesday
- Development
- Unit tests written alongside code
- QA writes/updates test cases for new features

### Thursday — Feature Freeze
- No new features merged after 12:00
- Bug fixes only after freeze
- QA starts regression testing
- CI smoke suite must be green

### Friday — Release Day
- QA sign-off by 12:00
- Release notes prepared
- Deployment to production
- Smoke suite run post-deploy
- Monitor CI and error reports for 2 hours post-release

---

## 4. Definition of Ready (for development)

A feature is ready for development when:

- [ ] Acceptance criteria defined and approved by PO
- [ ] QA has reviewed and added test cases
- [ ] Design / mockups available (if UI change)
- [ ] Dependencies identified and resolved
- [ ] Ticket estimated

---

## 5. Definition of Done (for release)

A feature is done when:

- [ ] Code reviewed and approved
- [ ] Unit tests written and passing
- [ ] All P1 automated tests passing in CI
- [ ] QA manually verified on staging environment
- [ ] No open P1 or P2 bugs
- [ ] Release notes updated
- [ ] Product Owner approved

---

## 6. QA Gate — Release Criteria

### Must Pass (blocking)
- All SM-* smoke tests green in CI
- No P1 (Critical) bugs open
- No regressions vs previous release
- `npm run preflight` passes on release environment

### Should Pass (non-blocking, logged)
- No new P2 bugs introduced
- Performance within acceptable range
- All manual test cases for new features executed

### Release is BLOCKED if
- Any SM-* smoke test fails
- P1 bug found with no workaround
- CI pipeline broken
- Grammarly Desktop update detected but regression not re-run

---

## 7. Release Versioning

Format: `MAJOR.MINOR.PATCH`

| Type | When | Example |
|---|---|---|
| PATCH | Bug fixes, minor improvements | 1.0.1 → 1.0.2 |
| MINOR | New feature, new test coverage | 1.0.0 → 1.1.0 |
| MAJOR | Breaking change, architecture change | 1.x.x → 2.0.0 |

---

## 8. Release Notes Template

```
## Release [version] - [date]

### New Features
- [Feature description]

### Bug Fixes
- [Bug ID] [Short description]

### Test Coverage Changes
- [New tests added / removed]

### Known Issues
- [Issue description, workaround if any]

### How to Update
- git pull origin master
- npm ci
- npm run preflight
```

---

## 9. Hotfix Process

For critical bugs found in production:

1. PO and QA confirm bug is P1 (Critical)
2. Dev creates hotfix branch from last release tag
3. Fix implemented and reviewed (fast-track, 2 reviewers)
4. QA runs smoke suite only (no full regression)
5. Hotfix deployed within 4 hours of P1 confirmation
6. Full regression run next business day

---

## 10. Rollback Plan

Trigger rollback if post-deploy monitoring shows:
- Smoke suite failure after deploy
- Error rate spike > 10%
- P1 bug reported by user within 2 hours

Rollback steps:
```bash
git checkout [previous-release-tag]
npm ci
npm run smoke:suite   # verify previous version works
# redeploy previous version
```

---

## 11. Dependency Monitoring

External dependencies that can break the release:

| Dependency | Risk | Action |
|---|---|---|
| Grammarly Desktop update | High - may change bubble UI | Run full regression before release if update detected |
| macOS update | Medium - may affect screencapture | Validate on updated OS before release |
| Google Chrome update | Low - channel: chrome should be stable | Run smoke after Chrome auto-update |
| Node.js / Playwright update | Low | Test on updated versions in CI before merging |

---

## 12. Communication Plan

| Event | Who to notify | Channel |
|---|---|---|
| Feature freeze | Dev team | Slack / Email |
| QA sign-off | PO, Dev Lead | Slack |
| Release deployed | All stakeholders | Email / Slack |
| Release blocked | PO, Dev Lead | Slack (urgent) |
| Hotfix needed | Dev Lead, DevOps | Slack (urgent) |
| Post-release issue | All stakeholders | Slack + Email |

---

## 13. Post-Release Checklist

- [ ] Smoke suite green post-deploy
- [ ] Release notes published
- [ ] Version tag created in git (`git tag v1.x.x`)
- [ ] Monitor CI for 2 hours
- [ ] Close resolved tickets in tracker
- [ ] Retrospective notes if issues occurred

---

## 14. Metrics

| Metric | Target |
|---|---|
| Release frequency | Weekly (every Friday) |
| Release success rate | > 95% (no rollbacks) |
| Time to hotfix (P1) | < 4 hours |
| Smoke pass rate at release | 100% |
| Mean time to detect regression | < 24 hours |
| Escaped defects (bugs found in prod) | 0 P1, < 2 P2 per release |
