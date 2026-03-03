# Sharing Optimization Plan

## Goal

Keep current UX intact while ensuring every shared URL returns the best possible image/text payload for X, iMessage, Slack, and other unfurl consumers.

## Constraints

- No changes to card interaction UX (expand behavior, GSAP behavior, styling feel)
- No broad refactors that risk regressions
- Ship in small, testable slices with rollback points

## Phase 1: Metadata correctness and consistency

- Confirm canonical URL strategy (`/card/[slug]` vs `/share/[slug]`) by platform behavior
- Keep OG and Twitter metadata synchronized for title/description/image
- Version social image URLs explicitly when changed (`?v=` cache-bust)
- Add a validation checklist for representative cards (normal, long text, missing data)

## Phase 2: Share image quality and reliability

- Ensure `twitter-image` generation always has valid fallback card image and title
- Define explicit safe layout bounds for long titles/text in generated images
- Validate generated image dimensions and MIME (`1200x630`, PNG)
- Add checks for broken remote image sources and graceful fallback rendering

## Phase 3: Link intent behavior and copy quality

- Verify share text source priority (Notion/local fallback) is deterministic
- Ensure URL + message payload formatting is platform-safe
- Keep quote text sanitization consistent and bounded
- Validate share flows on X and mobile share sheet

## Phase 4: Operational hardening

- Add lightweight pre-release share regression checklist
- Document “how to invalidate stale social caches” playbook
- Track key shared-card examples for quick smoke tests after deploy

## Release policy for sharing work

For each phase:

1. Implement a minimal diff
2. Validate against a fixed card sample set
3. Deploy
4. Re-check real unfurls
5. Move to next phase only if parity holds
