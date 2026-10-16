# Working in this repository

## Project and entry points
- Thai static demo for preparing incident documents. GitHub Pages serves `main` from the repository root; no build step.
- Start with `index.html` for current script/style paths. It loads `assets/app.js` and additional styles. Follow imports or symbol references only as needed.
- `README.md` documents behavior, browser AI limitations, and optional Supabase setup. `assets/portal-config.js` configures the officer portal connection.

## Keep context and edits focused
- Identify the requested outcome and acceptance criteria, then search filenames/symbols with `rg --files` and `rg -n` before reading code.
- Read only relevant ranges and dependencies. Do not dump entire large/minified assets, datasets, lockfiles, model files, or logs.
- Reuse existing patterns and dependencies. Prefer the smallest complete change; avoid unrelated refactors, formatting, or framework migrations.
- Batch independent reads/checks and keep output bounded. Re-read only when files changed or evidence is missing.
- Use repository evidence first; fetch external docs only for unresolved API/version questions.
- Start with one agent. Delegate only when explicitly requested or required by applicable instructions.
- Never trade correctness or necessary validation for token savings. Once relevant checks pass, repeat or broaden them only for a concrete unresolved concern.
- Report changes, validation, and remaining blockers briefly; do not repeat source code or full logs.

## Validation
- Logic changes: run relevant existing tests; run `node --test tests/*.test.mjs` for shared behavior or broader changes.
- Browser checks: serve with `python3 -m http.server 4187 --bind 127.0.0.1`. Use `http://127.0.0.1:4187/tests/submission.html` with synthetic documents for submission changes. The `?voice` variant mocks voice only; real GenAI downloads the model.
- UI changes: inspect affected states at mobile and desktop widths. Review the final diff.
- Documentation-only changes: verify facts, paths, and commands; no application test run is needed.
- State checks not run and why. Do not claim browser/model behavior was tested without running it.

## Preserve product behavior
- Keep Thai copy and existing browser-local document handling. Preserve explicit user review/confirmation of generated drafts and originals.
- Do not add paid AI fallbacks, secrets, or new data transmission without an explicit feature request.
- Preserve optional portal behavior and distinguish prototype submission from official police reporting.
