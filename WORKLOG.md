# Continuation checkpoint — AI Concierge round 2

Source of truth: editable ES modules in `assets/`, static GitHub Pages, no build step.
Base: b1e46ad (friend's implementation). Do not overwrite from the older Vinext project.

Scope from user PDF:
- [ ] Mock ThaiD entry and redesigned signature; no delete-signature button
- [ ] Remove privacy page; requests before document vault; image thumbnails
- [ ] Identity-only fields; improve free local OCR with preprocessing and alternative segmentation
- [ ] Accident now/past flow, location permission + fallback, photo/video evidence, one-step local simulation
- [ ] Printable result and honest tracking; no actual agency backend or government status
- [ ] Tests, mobile review, deploy verification

Constraints: no paid services, no real ThaiD connection, no backend. Browser geolocation is used instead of unreliable IP location. No private documents, keys or PDF source in git. Keep consent notices without a separate privacy page. No AI calls during testing.

Each tested milestone is committed and pushed to main as requested.
