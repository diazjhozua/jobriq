# Client instructions

Repository-wide guidance, including backend conventions, lives in the root `CLAUDE.md`.

## State

- Routes: `/profile` and `/applications`; unknown paths redirect to `/profile`.
- `src/providers/JobriqProvider.tsx` hydrates once from `GET /api/state` and exposes async mutations. Add new state there rather than introducing another store or per-component persistence.
- Hydration failure blocks the workspace with a retry panel; mutation failure rolls back optimistic updates and shows a dismissible sync banner. Do not swallow API errors silently.
- Every request carries the anonymous `jobriq_client` cookie; the server scopes all data to it. There is no `localStorage` persistence and no client-side storage key.
- Generated resumes live on the application (`generatedResume`) or on the workspace state as the profile page's standalone resume (`standaloneResume`), not in a separate store.
- A cover letter lives on the application (`coverLetter`). `CoverLetterDialog` generates through `generateCoverLetter(id)` (one server call, overwrites on regenerate), reuses `DocumentHeader` so the preview matches the resume letterhead, and exports or copies through `lib/coverLetter.ts`.
- `EditApplicationDialog` edits company, role, and the optional applied date through `updateApplication(id, details)`; it is the only path that changes an existing application's date.
- Profile review results are ephemeral provider state (`review`, `reviewedAt`, `reviewing`, `reviewError`) from `POST /api/profile/review`; applying a suggestion patches the form, nothing is persisted, so results reset on reload.

## Schemas

`src/lib/schemas.ts` keeps two profiles on purpose:

- Strict `profileSchema` and friends validate the form.
- Lenient `stored*` schemas validate API responses, so partially filled profiles still load.

When adding a field, update both, plus `src/lib/types.ts` and `src/lib/defaults.ts`.

## UI

- Tailwind tokens only, defined in `src/index.css`. No hex literals in components.
- Brand mark is `components/layout/Logo.tsx` (inline SVG using `fill-primary`, `fill-canvas`, `fill-accent`). Static copies `public/favicon.svg`, `public/apple-touch-icon.png`, and `../assets/logo.svg` hardcode the palette hex because they render outside CSS; update all three with the tokens.
- Status colors appear only in `features/applications/StatusBadge.tsx`.
- Forms use React Hook Form with the Zod resolver, explicit Save, and inline field errors. Do not add autosave.
- The Profile screen keeps skills in component state (`SkillsField` tags) rather than in the RHF form, and normalizes them plus trimmed, non-empty bullets before every save, review, or generation call.
- Experience, education, and projects each get an entry sub-nav (`EntryNav`) under the Add button. Labels come from `useWatch`, not `useFieldArray().fields`, which does not update while typing. Entry anchors are index-based (`profile-{section}-entry-{n}`) with `scroll-mt-[8rem]` and `tabIndex={-1}`.
- `Textarea` supports `autoGrow`, which resizes on mount, value change, input, and window resize. It only tracks controlled values, so pass `value`/`onChange` (use `Controller`, not `register`, for auto-growing fields).
- Dates use `MonthYearPicker` (`components/ui/month-year-picker.tsx`), which stores display strings (`Aug 2022`, `Present`) and parses legacy free text such as `2018` or `Jan 2022`. It is a controlled composite, so wire it through `Controller`. Project entries also have an optional associated company (`AssociatedWithField`) sourced live from experience companies plus `Personal Project`.
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
