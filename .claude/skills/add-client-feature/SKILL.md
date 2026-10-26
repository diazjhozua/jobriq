---
name: add-client-feature
description: Add a screen, dialog, or form to the Jobriq React client using the existing provider, schema, and styling patterns. Use for UI work under client.
---

# Add a client feature

Match the Profile and Applications screens; read `client/CLAUDE.md` first.

## Steps

1. **Types** — extend `client/src/lib/types.ts`.
2. **Schemas** — add the strict form schema and the lenient `stored*` schema in `client/src/lib/schemas.ts`, plus defaults in `lib/defaults.ts`. Partially filled stored data must still hydrate.
3. **State** — add the mutation to `client/src/providers/JobriqProvider.tsx` and to `JobriqContextValue`. Do not add a second store or per-component persistence.
4. **UI** — build the screen under `client/src/features/<area>/`, using existing `components/ui` primitives and `components/layout/AppShell`.
5. **Route** — add the route in `client/src/App.tsx` and the nav entry in `AppShell`.
6. **Styling** — Tailwind tokens from `src/index.css` only. No hex colors, no arbitrary color values. Status colors only in `StatusBadge`.
7. **Forms** — React Hook Form with the Zod resolver, explicit Save, inline errors, labels associated with inputs, focus ring preserved.
8. **API** — if the feature calls the backend, add it to `lib/api.ts` and surface `ProblemDetails.code` messages.
9. **Tests** — colocated `*.test.tsx` next to the component, using React Testing Library. Cover validation, the happy path, and the empty/error state.
10. **Check** — run `npm --prefix client run typecheck`, `npm --prefix client run lint`, `npm --prefix client test`, and confirm no horizontal scroll at 375px.

## Rules

- Data lives in PostgreSQL behind `/api/state` and the granular mutation endpoints; the client persists nothing locally.
- Keep the strict/lenient schema split when adding fields.
- Do not introduce a new styling system, state library, or fetch wrapper.
