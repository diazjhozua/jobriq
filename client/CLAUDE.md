# Client instructions

Repository-wide guidance, including backend conventions, lives in the root `CLAUDE.md`.

## State

- Routes: `/profile`, `/applications`, and `/settings`; unknown paths redirect to `/profile`.
- `src/providers/JobriqProvider.tsx` hydrates once from `GET /api/state` and exposes async mutations. Add new state there rather than introducing another store or per-component persistence.
- Prompt styles live on `state.promptStyles` (`styles`, `activeStyleId`, `baseline`). The four mutations (`createPromptStyle`, `updatePromptStyle`, `deletePromptStyle`, `activatePromptStyle`) replace that slice with the server snapshot; the first saved style auto-activates, and the read-only baseline applies whenever `activeStyleId` is null. `SettingsPage` is the only consumer.
- PII masking lives on `state.piiMasking` (`{ enabled: boolean }`), defaults to enabled, and is toggled by `setPiiMasking(enabled)` through `PUT /api/pii-masking`. The provider updates optimistically, replaces the slice with the server response, and rolls back with a sync error on failure. `SettingsPage` renders it in the Privacy section through `PiiMaskingSetting`.
- Resume themes live on `state.resumeThemes` (`themes`, `builtIns`, `activeThemeId`). The four mutations (`createResumeTheme`, `updateResumeTheme`, `deleteResumeTheme`, `activateResumeTheme`) replace that slice with the server snapshot. Built-ins come from the server and are never duplicated client-side; a missing slice falls back to `createEmptyResumeThemes()`, and `activeThemeId` falls back to `DEFAULT_RESUME_THEME_ID` (Classic). `SettingsPage` is the only consumer. It renders the themes as a thumbnail gallery beside a shared full-page `ResumeThemePreview`; the preview selection is local state, not activation, and `ResumeThemeDialog` reuses the same preview.
- Hydration failure blocks the workspace with a retry panel; mutation failure rolls back optimistic updates and shows a dismissible sync banner. Do not swallow API errors silently.
- Every request carries the anonymous `jobriq_client` cookie; the server scopes all data to it. There is no `localStorage` persistence and no client-side storage key.
- Generated resumes live on the application (`generatedResume`) or on the workspace state as the profile page's standalone resume (`standaloneResume`), not in a separate store.
- A cover letter lives on the application (`coverLetter`). `CoverLetterDialog` generates through `generateCoverLetter(id)` (one server call, overwrites on regenerate), reuses `DocumentHeader` so the preview matches the resume letterhead, and exports or copies through `lib/coverLetter.ts`.
- `EditApplicationDialog` edits company, role, and the optional applied date through `updateApplication(id, details)`; it is the only path that changes an existing application's date.
- Profile review results are ephemeral provider state (`review`, `reviewedAt`, `reviewing`, `reviewError`) from `POST /api/profile/review`; applying a suggestion patches the form, nothing is persisted, so results reset on reload.

## Schemas

`src/lib/schemas.ts` keeps two profiles on purpose:

- Strict `profileSchema` and friends validate the form; `promptStyleFormSchema` and `resumeThemeFormSchema` validate the Settings dialogs.
- Lenient `stored*` schemas validate API responses, so partially filled profiles still load. `promptStylesSchema`, `resumeThemesSchema`, and `piiMaskingSchema` are lenient in the same way: missing slices in the state fall back to `createEmptyPromptStyles()`, `createEmptyResumeThemes()`, and `createEmptyPiiMasking()` (enabled).

When adding a field, update both, plus `src/lib/types.ts` and `src/lib/defaults.ts`.

Backend request/response DTOs live in `src/Jobriq.Contracts`; `src/lib/schemas.ts` is the consumer contract for those DTOs. A structural backend refactor must not require client changes. After a backend DTO change, run `npm --prefix client test -- src/lib/schemas.test.ts src/lib/api.test.ts` and update the backend contract snapshots only for an intentional contract change.

## UI

- Tailwind tokens only, defined in `src/index.css`. No hex literals in components.
- Brand mark is `components/layout/Logo.tsx` (inline SVG using `fill-primary`, `fill-canvas`, `fill-accent`). Static copies `public/favicon.svg`, `public/apple-touch-icon.png`, and `../assets/logo.svg` hardcode the palette hex because they render outside CSS; update all three with the tokens.
- Status colors appear only in `features/applications/StatusBadge.tsx`.
- Forms use React Hook Form with the Zod resolver, explicit Save, and inline field errors. Do not add autosave.
- The Profile screen keeps skills in component state (`SkillsField` tags) rather than in the RHF form, and normalizes them plus trimmed, non-empty bullets before every save, review, or generation call.
- The Profile header's Export profile button calls `downloadProfile` (through `useProfileExport`) with the current form values, including unsaved edits, and downloads the server-written import-template text. Export failures render an inline `role="alert"` below the header; the button shows a spinner while the request runs.
- `TagListField` owns the tag-editing behavior (Enter/comma add, paste split, Backspace remove, case-insensitive dedupe, blur commit). `SkillsField` wraps it for the overall list and `SkillsGainedField` wraps it for the per-entry `skillsGained` list; `SkillsGainedSuggestions` lists missing entry skills grouped by source using `skillsGained.ts` helpers. Per-entry skills are profile-only: never rendered in previews or exports, never sent to prompts.
- Experience, education, certifications, awards, and projects each get an entry sub-nav (`EntryNav`) under the Add button. Labels come from `useWatch`, not `useFieldArray().fields`, which does not update while typing. Entry anchors are index-based (`profile-{section}-entry-{n}`) with `scroll-mt-[8rem]` and `tabIndex={-1}`; `ProfileEntryCard` renders the shared anchor, heading, and Remove shell.
- `Textarea` supports `autoGrow`, which resizes on mount, value change, input, and window resize. It only tracks controlled values, so pass `value`/`onChange` (use `Controller`, not `register`, for auto-growing fields).
- Dates use `MonthYearPicker` (`components/ui/month-year-picker.tsx`), which stores display strings (`Aug 2022`, `Present`) and parses legacy free text such as `2018` or `Jan 2022`. It is a controlled composite, so wire it through `Controller`. It covers experience, education, and project ranges, certification issue and expiration dates, and the award issue date. Project and award "Associated with" fields, the award "Issuer", and the certification "Issuing organization" use `ProfileComboboxField`, which wraps the `Combobox` primitive (`components/ui/combobox.tsx`): a text input with a Radix Popover suggestion list that accepts custom text. Project associations suggest experience companies, education schools, and `Personal Project`; award associations suggest companies and schools; issuer and issuing-organization fields suggest companies, schools, and values pooled from certifications and awards. Options come from live form values via `useProfileOptionSets` (`profileOptions.ts`), deduped case-insensitively; stale values are preserved because the input text is the value.
- Dated sections auto-arrange newest first. `MonthYearPicker` exposes `onCommit`, and `ProfilePage` wires it to `useAutoArrangeFieldArray` (`lib/ordering/`), which sorts with `sortProfile` and applies react-hook-form `move` calls so entry cards keep their keys and focus. `normalize`, template import, and `GeneratedResumeDialog` sort as well. Experience, education, and projects order by start date then end date (`Present` newest); certifications and awards by issue date; undated and legacy values stay last and stable.
- The Profile screen keeps its Save control in a `ProfileSaveBar` at the end of the form, styled `sticky bottom-0` so it pins to the viewport while editing. It mounts only while the form is dirty (`isDirty || skillsDirty`) or for the 3-second `Saved` window, and shows `Saving…` while submitting. Do not switch it to `fixed`: the `page-enter` transform animation makes a fixed descendant position against the page instead of the viewport.
- Both Generate Resume dialogs show `EnhanceProfileNotice` before the first generation, pointing at `#profile-review`.
- Keep the focus ring (`--brand-blue`, 2px, 2px offset) and label/input associations intact; dialogs are Radix primitives.

## Commands

```bash
npm run dev
npm run build
npm run lint        # oxlint; there is no ESLint or Prettier
npm run typecheck   # tsc -b
npm test            # Vitest, tests colocated as *.test.ts(x)
npm test -- src/lib/schemas.test.ts
```
