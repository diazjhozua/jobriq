# Client instructions

Repository-wide guidance lives in the root `CLAUDE.md`; backend guidance is in `../CLAUDE.md`.

## State

- Routes: `/profile` and `/applications`; unknown paths redirect to `/profile`.
- `src/providers/JobriqProvider.tsx` loads state once and saves the entire state on every mutation. Add new state there rather than introducing another store or per-component persistence.
- Storage key is `jobriq.v1`. `src/lib/storage.ts` swallows parse and quota errors and falls back to defaults; `saveState` returns `false` so the provider can show the non-blocking storage warning.
- Generated resumes live on the application (`generatedResume`), not in a separate store.

## Schemas

`src/lib/schemas.ts` keeps two profiles on purpose:

- Strict `profileSchema` and friends validate the form.
- Lenient `stored*` schemas hydrate `localStorage`, so partially filled profiles still load.

When adding a field, update both, plus `src/lib/types.ts` and `src/lib/defaults.ts`.

## UI

- Tailwind tokens only, defined in `src/index.css`. No hex literals in components.
- Status colors appear only in `features/applications/StatusBadge.tsx`.
- Forms use React Hook Form with the Zod resolver, explicit Save, and inline field errors. Do not add autosave.
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
