---
name: repo-onboarding
description: Use when starting work in an unfamiliar repository, when the task asks for repo overview, setup, architecture, entrypoints, test commands, or where to begin. Skip for narrow file-scoped edits once the relevant paths are already known.
---

# Repo Onboarding: learning-games

## When to Use

- Load this skill first when the repository is unfamiliar or the request is broad.
- Recommended when: first task in repo, repo overview, setup or run instructions, architecture or entrypoints, where should I start, broad debugging or feature-localization request.
- Skip when: known file-scoped edit, follow-up inside already identified area, task already localized to concrete files.
- Use `.codex/skills/aethyme/SKILL.md` or `.claude/skills/aethyme/SKILL.md` for Aethyme's short operating contract after orientation; load its `references/` files only when needed.

## Repo Identity

- Kind: `application`
- Languages: `typescript`
- Package manager: `npm`
- Key manifests: `package.json`

## Workspaces

- `.` (primary; npm; manifest `package.json`; high confidence)

## Start Here

- `install`: `npm install`
- `dev`: `npm run dev`
- `fast_test`: `npm run test`
- `lint`: `npm run lint`
- `build`: `npm run build`

## Supporting Commands

- `npm install` (install; high confidence from `package.json`)
- `npm run dev` (dev; high confidence from `package.json`)
  Workspace: `.`
- `npm run test` (fast_test; high confidence from `package.json`)
  Workspace: `.`
- `npm run lint` (lint; high confidence from `package.json`)
  Workspace: `.`
- `npm run build` (build; high confidence from `package.json`)
  Workspace: `.`

## Entrypoints

- `app`: `package.json:scripts.dev` (package dev script; medium confidence)
- `test`: `package.json:scripts.test` (package test script; medium confidence)

## Additional Entrypoints

- `package.json:scripts.dev` (script; role=app; package dev script; medium confidence)
- `package.json:scripts.test` (script; role=test; package test script; medium confidence)

## Repo Map

- `.github` (automation; automation and CI configuration; high confidence)
- `public` (assets; public assets or static files; high confidence)
- `src` (source; conventional source directory; high confidence)

## Aethyme Recipes

- `aethyme explore --repo "$PWD" --request "<task>" --format answer-json`
  Purpose: Broad repository orientation for a user request
- `aethyme repo inspect "$PWD" --mode brief --json-output`
  Purpose: Quick deterministic repo summary
- `aethyme graph callers "$PWD" "<symbol-or-file>" --json-output`
  Purpose: Trace likely impact before editing

## Generated and Dangerous Paths

- Generated/vendor `.aethyme/generated`: tracked generated or vendored surface; verify ownership before editing
- Sensitive `.aethyme/gates.toml`: repository validation policy; changes affect every broker submission
- Sensitive `.github/workflows`: repository automation; changes can affect publication or shared CI

## Freshness

- Source digest: `1ce119c03a2a2b96352847874f6c5870775ec1b888417e01012a1f79267b63ba`
- Tracked source files: `39`
- Overrides applied: `False`
- Sections generated: `repo, workspaces, primary_workspace, commands, areas, entrypoints, caution_zones, generated_paths, dangerous_paths, navigation_recipes, summon, freshness`
