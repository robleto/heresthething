# Rollback Changelog (2026-03-03)

## Rollback goal

Restore the project to the state *before* the Lighthouse/performance intervention work that introduced regressions.

## Rollback point

- Current branch reset from: `8a0a850`
- Reset target (pre-Lighthouse intervention): `9f909ca`
- Command used: `git reset --hard 9f909ca`

## Reverted commits

1. `8a0a850` — Enhance Grid component with GSAP animations and improve card reveal effects
2. `d7f6d93` — Refactor: streamline Grid component and integrate getCards for initial data

## Files reverted by rollback

- `app/components/Grid.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/styles/global.css`
- `lib/cards.ts`
- `next.config.ts`
- `package.json`
- `package-lock.json`

## What was removed by this rollback

- Server-side `getCards` integration for homepage grid bootstrap from those commits
- Lightweight card reveal pipeline introduced in that sequence
- Progressive/lazy GSAP enhancement path added in that sequence
- Related image optimization and config adjustments from those commits
- Data fetching/caching adjustments introduced in that sequence

## Notes

- This rollback is intentionally broad to restore known-good behavior prior to the Lighthouse fix cycle.
- Local branch is now behind remote by 2 commits (`main ⇣2`) until you choose how to sync (force-push, branch off, or cherry-pick).
