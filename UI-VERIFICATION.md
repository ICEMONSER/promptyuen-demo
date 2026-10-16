# Reference redesign validation

17 October 2026 (Asia/Bangkok). Static root site, no build step.

## Skills and setup
Node v24.19.0 from the Codex runtime. `npx --yes skills add pbakaus/impeccable --skill impeccable --yes` could not run because npx is absent. Required fallback used:

```sh
git clone --depth 1 https://github.com/pbakaus/impeccable.git /tmp/promptyuen-impeccable
git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git /tmp/promptyuen-taste
cp -R /tmp/promptyuen-impeccable/cursor-plugin/skills/impeccable .agents/skills/impeccable
cp -R /tmp/promptyuen-taste/skills/taste-skill .agents/skills/design-taste-frontend
cp -R /tmp/promptyuen-taste/skills/redesign-skill .agents/skills/redesign-skill
.agents/skills/impeccable/scripts/impeccable context
```

Loaded all three skill instructions and relevant references; initialized PRODUCT.md and DESIGN.md from the explicit brief. User-pinned references override randomized directions and interview gates. Separate commit b3ae60c contains skill installation and context.

## Evidence and checks
- Both live reference websites opened. Full-page captures at 1440×900 and 390×844 in local ignored `.design-evidence/references/`. Live computed colors recorded in DESIGN.md. Viriyah blocks headless capture; ordinary browser capture succeeded.
- Baseline: 64 passing tests, one suite unable to import two missing modules. Restored exact pure modules from historical commit 9919329 in separate commit cd8c3b0; no reverted concierge UI reconnected.
- `node --test tests/*.test.mjs`: 74 pass, 0 fail.
- `node --check assets/app.js`: passes. `git diff --check`: passes.
- Two rendered critique/fix rounds at 1440, 768 and 390px, screenshots saved locally in `.design-evidence/round1/` and `round2/`. Second round: no overflow, heading, contrast, gradient, shadow or small-text failures. Inspector allowed two explicit brief exceptions: `few-pictures` (feature tabs show one of four real screenshots at a time) and `focal-point` (reference-matched split hero rather than oversized gallery typography). Remaining warnings: no footage and 15 moving elements; deliberate restraint for users under stress.
- Taste static lint ran. Its findings for `box-shadow:none` and hidden legacy eyebrow selectors are false positives; only the actual floating tweak panel has a shadow.
- Impeccable critique: independent assessments A and B. A found setup field spacing, a wrong voice crop, mobile tweak overlap and competing category buttons; fixed by stacked fields, accurate crop, menu-contained display control and progressive disclosure of other topics. A also exposed a temporarily malformed legacy stylesheet edit; restored valid original CSS with only the external font import removed. B ran detector once: five warnings, all from legacy overrides or wrapper padding; no live overlay because browser evaluation is read-only.
- Polish pass: Thai leading, two requested font weights, visible focus, 44px targets, correct screenshot file extensions, SVG microphone, optional signature copy, theme/reset controls, reduced motion, retained selectors and callbacks.
- Browser flow with synthetic data: contact setup → optional signature → workspace; upload validation and document review; station changed to Lumpini; evidence attached; generation cancellation retained original; simulated submit produced `ผ่าน: บันทึกสำเร็จ · สถานีตำรวจนครบาลลุมพินี` and printable report.
- Full model download/generation and actual ID OCR accuracy were not verified; original implementations remain intact. Supabase remains unconfigured and offline by default. Late in delivery, local browser access was disabled in Work settings; additional final interactive verification could not run.

## Reference deviations
No copied logos, pictures, copy, testimonials or business metrics. Purple gradients, dark promotional sections and sales content from AI Insurance were replaced by the requested white/light-gray Thai preparation content. Thai line-height is more generous than the Latin reference. Gold is reserved for text selection rather than low-contrast text. No video or stock imagery; product screenshots keep the site light. Map screenshot contains its original OpenStreetMap attribution; no reference-site assets are shipped.
