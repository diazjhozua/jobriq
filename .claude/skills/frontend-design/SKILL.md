---
name: frontend-design
description: Visual and interaction design for new or reshaped Jobriq UI, inside the existing design system. Use when designing a screen, dialog, empty state, or layout, or when a UI change needs a design decision before code.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Adapted from the `frontend-design` plugin (Apache-2.0, see `LICENSE.txt`). The plugin's goal is a distinctive identity for a new brief; Jobriq already has one, so the goal here is a design that is intentional and unmistakably part of the same product. Consistency wins over novelty. Read `client/CLAUDE.md` before designing.

## The existing system

Jobriq is a quiet, document-like workspace for job seekers: a resume builder and application tracker. It should feel like well-set paper and careful editing, not a SaaS dashboard.

- **Color** — tokens in `client/src/index.css` only: `canvas`, `surface`, `border`, `navy`, `body`, `muted`, `disabled`, `primary` / `primary-hover` (deep green), `link`, `brand-blue` (focus ring), `accent` (oxblood). Status colors live only in `features/applications/StatusBadge.tsx`. Never add hex values to components.
- **Type** — `font-display` (Newsreader serif) for headings and document titles; `font-sans` (IBM Plex Sans) for UI and body. No third family.
- **Shape** — near-square radii (`radius-sm` to `radius-xl`, 1-4px) and the single `shadow-sheet` for elevated sheets. Do not introduce rounded cards or soft generic shadows.
- **Primitives** — `components/ui` (`button`, `card`, `dialog`, `alert-dialog`, `field`, `input`, `label`, `select`, `textarea`, `month-year-picker`) and `components/layout/AppShell`. Compose these before writing new ones.
- **Documents** — resume and cover-letter previews share `DocumentHeader`; new generated documents should too.

If a design truly needs a new token, propose it as an addition to `index.css` with its role and contrast ratio, and get approval first.

## Principles

- **Structure is information.** Borders, dividers, numbering, and labels must encode something. Use numbering only for real sequences.
- **Typography carries the personality.** Use the serif for headings and document content; keep UI chrome in the sans. Set a clear hierarchy with weight and size, not color.
- **Spend boldness in one place.** One memorable element per screen; everything around it stays quiet.
- **Motion answers actions.** Opening, expanding, saving, and generating may animate to show what changed. No decorative entrance animations. Respect `prefers-reduced-motion`.
- **Line length under ~80 characters** for prose; serif text gets slightly more line-height.

Avoid generated-UI tells: identical rounded cards for everything, all-caps eyebrow labels, accenting a single word in a headline, `A · B · C` meta strings, `→` appended to buttons, gradient washes, and a monospace face for small labels.

## Process

1. **Brief** — state the screen's user, primary job, and the data it shows, using real Jobriq content (profiles, applications, statuses, generated bullets).
2. **Plan** — which existing tokens and primitives it uses, a short layout description with an ASCII wireframe for desktop and 375px, the one element that carries emphasis, and the empty, loading, and error states.
3. **Check the plan** against the existing Profile and Applications screens. If any part looks like it came from a different product, or like a generic default, revise it and say what changed.
4. **Build** following the `add-client-feature` skill.
5. **Critique** — run the app (`npm run dev` against the host) and screenshot desktop and 375px. Remove one thing that does not earn its place. Then hand off to `ui-reviewer`.

## Quality floor

Responsive to 375px with no horizontal scroll, visible `:focus-visible` ring (`brand-blue`, 2px, 2px offset), labels associated with inputs, Radix dialogs that restore focus, keyboard reachable controls, and AA contrast.

## Writing

Words are design content. Write for the user, not the system: "Generate resume", not "Run enhancement pipeline".

- Active voice, sentence case, plain verbs. A button says what happens ("Save profile", not "Submit"), and the confirmation uses the same verb ("Profile saved").
- Errors say what went wrong and how to fix it, mapped from `ProblemDetails.code`; they never apologize and never leak technical detail.
- Empty states invite the next action ("Add your first application").
- Match the existing vocabulary: profile, application, status, generated resume, cover letter, review suggestions.
