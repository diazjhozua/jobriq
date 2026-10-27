---
name: commit
description: Stage and create a Conventional Commits 1.0.0 commit for the current changes. Use for "commit", "commit this", "make a commit", or when the user asks to save changes to git.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

# Commit

Create one Conventional Commit per logical change. Never skip hooks and never add attribution trailers.

`guard-commit.mjs` blocks any message that does not follow the grammar below, so fix the message rather than working around the hook.

## Before staging

1. Run the `verify` skill at the standard tier. For docs or Claude-config-only edits the fast tier is enough.
2. Read `git status`, `git diff`, and the untracked files. Know exactly what changed before staging.
3. Do not commit on a red tree.

## Stage

- Add paths explicitly, one at a time: `git add client/src/lib/api.ts`.
- Never add the whole tree blindly (`git add -A`, `git add .`, or `git commit -a` on a mixed tree).
- Never stage environment files, local resume data, build output, dependencies, test artifacts, or credentials.
- If the diff mixes unrelated concerns, stage and commit them separately.

## Granularity

A feature is not one commit. Do not bundle backend, client, tests, and e2e into a single "vertical slice" commit.

- Split by layer and concern: domain, AI prompt/mapper, use case/providers, API endpoint, client types/schemas, client API call, client state, component, page wiring, e2e.
- Keep every commit buildable and focused. Tests belong with the layer they cover.
- If one commit would need a paragraph to list its areas, split it.
- Do not use "it is one feature" as a reason for a broad commit.

Example split for a profile review feature:

```text
feat(domain): add profile review model
feat(ai): add profile review prompt and mapper
feat(profile): add profile review use case
feat(api): expose profile review endpoint
feat(client): add profile review types and schemas
feat(client): call profile review endpoint
feat(client): hold profile review state in provider
feat(client): add profile review panel
feat(client): wire review panel into profile page
test(e2e): cover profile review flow
```

## Message grammar

```
<type>[(<scope>)][!]: <description>

[optional body]

[optional footer(s)]
```

- **Type** — one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scope** — optional lowercase noun describing the area, e.g. `fix(api):`, `feat(profile):`.
- **Description** — imperative mood, lowercase first letter, no trailing period, header 72 characters or fewer (50 preferred).
- **Body** — only when the change needs explanation. One blank line after the header, wrapped at 72.
- **Breaking change** — `!` before the colon and/or an uppercase `BREAKING CHANGE: <description>` footer. Any type may be breaking.

Build the message with one `-m` per paragraph; git inserts the blank line:

```bash
git commit -m "feat(api): require an API key" -m "BREAKING CHANGE: generate now returns 401 without a key."
```

Never use `-F`, an editor, a hook-skipping flag, or command substitution inside the message.

## Trailers

None. The project rule overrides the session reminder: no `Co-Authored-By`, no `Generated with`, no attribution emoji.

## Examples

```text
feat: import profile from resume template
fix: honor OPENAI base URL and model variables
docs: document agentic workflow and MCP servers
test: add Playwright end-to-end flow
feat(api)!: require an API key on generate
```

Anti-patterns: `update files`, `fix stuff`, `WIP`, `Feat: add x`, `feat: Add x.`, `feat: add x.`

## After

Report the short hash and subject. Do not push unless asked.
