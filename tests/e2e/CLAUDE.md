# Playwright instructions

Repository-wide guidance lives in the root `CLAUDE.md`.

## Isolation

- The suite runs against its own host on port 5081 with `ASPNETCORE_ENVIRONMENT=Testing`, which selects `FakeResumeAiService`. It never calls OpenAI.
- `reuseExistingServer: false` is deliberate. Never point the suite at the developer server on 5080 or relax this flag.
- `start-server.mjs` starts a disposable `postgres:18-alpine` container named `jobriq-e2e-postgres` on a random loopback port with trust auth, creates a unique `jobriq_e2e_<timestamp>` database through `Database__ApplyMigrationsOnStartup=true`, rebuilds the client, and then starts the host. `global-teardown.ts` removes the container. Docker must be running.
- Do not reuse the developer database from `docker compose`; the suite must stay isolated from `jobriq`.
- Each test gets a fresh browser context and therefore a fresh `jobriq_client` cookie, so workspaces do not leak between tests. No database reset between tests is required.
- The clean-cutover test seeds `jobriq.v1` with `page.addInitScript` and asserts the server workspace starts empty.
- Run with `npm --prefix tests/e2e test` or `npm run test:e2e` from the repository root.
- Assert user-visible behavior and the download filename patterns (`{slug}-resume-YYYYMMDD-HHMMSS`, `{slug}-cover-letter-YYYYMMDD-HHMMSS`, and `{slug}-profile-YYYYMMDD-HHMMSS`). Do not assert on AI text beyond the deterministic fake output.

## Structure

- `support/` — leaf helpers with no page knowledge: `patterns.ts` (export filename regexes), `downloads.ts` (`captureDownload` arms the download waiter before the trigger, `downloadText`), `month-year.ts` (portaled MonthYearPicker), `combobox.ts` (portaled combobox options), `layout.ts` (document/dialog/table overflow, animation settling, scrolling, bounding boxes).
- `pages/` — one page object per screen. `base.page.ts` owns navigation, unnamed dialog/alert-dialog access, heading assertions, and overflow assertions. `app-shell.page.ts` owns the top nav links.
- `pages/profile/` — `profile.page.ts` composes the `personal`, `entries`, `skills`, and `review` sections. Entry locators are scoped by the `role="group"` accessible name (`Experience 1`, `Certification 1`, `Project 1`); use `comboboxField` for a filled combobox because its Clear button shares the label.
- `pages/applications/` — `applications.page.ts` plus `application-row.ts`; row actions are addressed by the existing accessible names (`Status for {role} at {company}`, `Generate/View resume for …`, `Delete …`).
- `pages/settings/` — `settings.page.ts` composes the `promptStyles`, `themes`, and `privacy` sections.
- `pages/overlays/` — one class per dialog: template import, profile review, resume (standalone and per-application), cover letter, add/edit application, prompt style, resume theme, confirm.
- `fixtures/` — extends the Playwright `test` with `nav`, `profile`, `applications`, and `settings`; `fixtures/types.ts` holds the fixture map. Every fixture is test-scoped and built from the per-test `page`.
- `specs/` — user stories only, split by area: `profile/{personal,entries,skills,review,resume}.spec.ts`, `applications/{details,resume,cover-letter}.spec.ts`, `settings/{prompt-styles,themes,privacy}.spec.ts`, `responsive/{applications,profile,settings}.spec.ts`.

## Conventions

- Specs import `test` and `expect` from `../../fixtures` and never call `page.getBy*` directly except for viewport, reload, evaluate, addInitScript, keyboard, and option selection. Overlays are returned by page-object methods (`openResume`, `openReviewDialog`, `openNewTheme`, `edit`, `writeCoverLetter`), so specs do not import `pages/overlays/` directly.
- Keep locators accessible-name based; there are no `data-testid` attributes. Do not add any. The one product marker in use is `[data-theme-page]`, which `ResumeThemePreview` renders for the side-by-side layout assertion; it is not a test id.
- Register `waitForResponse` before the action that triggers it (`setStatus`, `delete`, `privacy.set`); `captureDownload` does the same for downloads.
- MonthYearPicker and combobox popovers portal to `document.body`, so their year select, month button, and options resolve from `page`, not from the entry group.
- Preserve the exact scoping modifiers when moving a locator: `.first()`, `.last()`, and `exact: true` exist to avoid strict-mode collisions (for example the `Applications` page heading vs the `No applications yet` empty-state heading).
- Layout assertions keep the original arithmetic (`scrollWidth - clientWidth`, `y + height <= bar.y + 1`) and tolerances. Do not tighten or relax them.

## Commands

Run from the repository root:

```bash
npm --prefix tests/e2e test
npm --prefix tests/e2e test -- specs/profile
npm --prefix tests/e2e test -- specs/settings/themes.spec.ts
npm --prefix tests/e2e test -- --list
npm run test:e2e
```
