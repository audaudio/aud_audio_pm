# docs-001: audaudio.github.io on Astro and Starlight, after rljson.github.io

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's decision at the plan review on
  2026-10-08; topics/docs-site.md (R16)
- Open work: Audanika brand assets (logo, palette) for the theme; build
  the API docs in the deploy workflow or commit them; a German locale
  through Starlight's i18n; confirm that the snippet tests can render
  audio offline on CI once `aud_audio_graph` exists

## Decision

The documentation site lives in the repo `audaudio/audaudio.github.io`
and is built with Astro and Starlight, created from `rljson.github.io`
as the template: the same stack (Astro 7, Starlight 0.42, pnpm,
TypeScript strict, Prettier with the Astro plugin, vitest, the DNA
layers `@ggdna/dna-vscode` and `@ggdna/dna-scripts` through helix-js),
the same layout (`src/content/docs` with a splash landing page, guides
and a reference, the sidebar in `astro.config.mjs`, a custom theme CSS,
a `<Snippet>` component), the same rules (every code block on a page
comes from a tested file, marked with `#region` comments; a missing
region fails the build) and the same deployment (GitHub Actions with
`withastro/action` and `actions/deploy-pages` on every push to `main`,
plus the gg quick check). What changes for aud_audio: the tested
snippets are Dart — `test/content/docs/<page>_test.dart` in a Dart test
package pinned to the released `aud_audio` packages, run by `dart test`
before `astro build`, rendering through the fake IO backend and the
offline renderer and writing goldens next to the page; the API docs of
all packages come from one `dart doc` run over a synthetic umbrella
package into `public/api/`, linked from the sidebar; a `sync-packages`
script copies each package's own doc pages into `guides/packages/` so
the package repos stay the single source of truth; the theme CSS maps
Audanika's palette onto Starlight's variables in place of the
angular.dev look. English first; German follows through Starlight's
locales when wanted.

## Why

- The owner's decision; rljson.github.io is a working, tested
  instance of exactly this stack in the same tooling family.
- Tested snippets keep the docs honest against the released packages;
  Starlight gives search, dark mode, i18n and a sidebar for free.
- Organization Pages sites need this repo name; the Actions deployment
  avoids the Jekyll build limits.
