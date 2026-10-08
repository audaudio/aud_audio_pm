# Topic: the documentation site audaudio.github.io

Research for R16, sources fetched 2026-10-07.

## Facts

- An organization site needs a repo named `audaudio.github.io`; one
  Pages site per organization; project sites appear under
  `audaudio.github.io/<repo>` and inherit a custom domain as sub-paths.
  Publishing from a branch (optionally `/docs`) or through a GitHub
  Actions workflow; Jekyll runs unless `.nojekyll` exists. Limits: 1 GB,
  100 GB/month soft bandwidth, 10 builds/hour without Actions; sites of
  private repos are public (Pro/Team plans).
- Generators: Material for MkDocs 9.7.7 (MIT, Python, versioning via
  mike, some features sponsor-only), Docusaurus 3.10.2 (MIT, Node 20+,
  versioning, i18n, several docs instances), Astro Starlight 0.42.5
  (MIT), Jekyll 4.4.1 (MIT, native Pages build), VitePress 1.6.4 (MIT).
  Dart: `jaspr` 0.23.5 (MIT, actively maintained, static generation,
  Flutter-like components), `static_shock` 0.0.14 (MIT, 2024).
- API docs: `dart doc` documents one package per run; cross-package
  links via `dartdoc_options.yaml` `linkTo`; api.flutter.dev builds all
  packages in one run through a synthetic package that depends on every
  package and a library importing them. pub.dev generates per-package
  API docs at `pub.dev/documentation/<pkg>/latest`; the pubspec
  `documentation:` field points to a separate site.
- AudioKit documents 15 packages on audiokit.io with DocC-generated
  API references and a Cookbook repo of examples.

## The template: rljson.github.io

The documentation site of Rljson (`rljson/rljson.github.io`, inspected
2026-10-08, version 0.0.16) is the model for audaudio.github.io.

- Stack: Astro ^7.3.5 with `@astrojs/starlight` ^0.42.5 and `sharp`;
  pnpm; TypeScript strict (`astro/tsconfigs/strict`); Prettier with
  `prettier-plugin-astro`; vitest 5 with 100 % coverage thresholds on
  the site's own TypeScript; `@tssuite/golden` for golden files;
  helix-js DNA with the layers `@ggdna/dna-vscode` and
  `@ggdna/dna-scripts`; a version file `src/rljson_github_io_version.ts`;
  `AGENTS.md` with the rules for AI agents.
- Layout: `src/content/docs/index.mdx` is a Starlight splash page (hero
  with tagline, logo, actions, `CardGrid` of selling points and
  getting-started cards); `guides/<chapter>/*.mdx` tutorials;
  `reference/ecosystem.md` as a table of all packages with their
  purpose; `src/assets` for logo and figures (SVGs imported as
  components so they follow the theme switch); `src/styles/angular.css`
  maps the angular.dev palette and type scale onto Starlight's
  variables; fonts Inter, Inter Tight and DM Mono from Google Fonts; the
  sidebar, logo, social links and edit link live in `astro.config.mjs`.
- Tested snippets: every TypeScript block on a page comes from
  `test/content/docs/<page>.spec.ts`, mirrored to the page path.
  Regions are marked `// #region <name>` / `// #endregion <name>`, may
  have several parts (imports at the top, code in the test) and are
  shown with `<Snippet file="x.spec.ts" region="name" />`; outputs are
  written with `writeGolden` to `test/goldens/content/docs/<page>/` and
  shown with `<Snippet file="out.json" title="Output" />`. The
  `Snippet.astro` component reads the files through `import.meta.glob`,
  so the dev server updates a page when its test changes; a missing
  file or region fails `astro build`; the extractor is language-agnostic
  and takes the code language from the file extension.
- Tutorials build one sample application per page inside a region
  `app`, so the full file shown at the end is exactly the tested code.
- Single source of truth: `scripts/sync-usecase.js` copies a page and
  its SVGs from another package's `doc` folder into the site before
  `dev` and `build` (`predev`, `prebuild`); the generated page is not
  edited by hand.
- Scripts: `dev`, `build` (`pnpm run test && astro build`), `preview`,
  `lint` (`astro check`), `test` (vitest and `astro check`), `format`.
  VS Code `launch.json` has "Preview page", which opens the page of the
  current `.mdx` file in the integrated browser.
- Deployment: `.github/workflows/deploy.yml` builds with
  `withastro/action@v6` (pnpm) and deploys with
  `actions/deploy-pages@v5` on every push to `main`;
  `quick_check.yaml` runs `npx @tssuite/ggwsm one did commit`.

## What holds for aud_audio (docs-001, accepted 2026-10-08)

- `audaudio/audaudio.github.io` is created from this template with the
  same stack, layout, rules and deployment.
- Snippets become Dart: `test/content/docs/<page>_test.dart` in a Dart
  test package pinned to the released `aud_audio` packages, the same
  `#region` markers, run by `dart test` before `astro build`, rendering
  through the fake IO backend and the offline renderer; goldens are
  written by a small Dart helper into `test/goldens/...` and shown with
  the unchanged `<Snippet>` component.
- API docs: one `dart doc` run over a synthetic umbrella package into
  `public/api/`, produced in the deploy workflow (Dart SDK via
  `dart-lang/setup-dart`) and linked from the sidebar; every package's
  pubspec `documentation:` field points to its page.
- `scripts/sync-packages.js` copies each package's doc pages into
  `guides/packages/`, as `sync-usecase.js` does for Rljson.
- `src/styles/audanika.css` replaces `angular.css`; logo and figures
  come from an Audanika assets source (open work).
- The cookbook app (the umbrella's example) feeds the guides with
  runnable snippets, as AudioKit's Cookbook does.

## Sources

- https://github.com/rljson/rljson.github.io (README.md, astro.config.mjs, package.json, src/components/Snippet.astro, src/snippets, scripts/sync-usecase.js, .github/workflows)

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/about-custom-domains-and-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://github.com/squidfunk/mkdocs-material, https://github.com/facebook/docusaurus, https://github.com/withastro/starlight
- https://pub.dev/packages/jaspr, https://pub.dev/packages/static_shock
- https://github.com/dart-lang/dartdoc, https://raw.githubusercontent.com/flutter/flutter/master/dev/tools/create_api_docs.dart
- https://dart.dev/tools/pub/pubspec
- https://www.audiokit.io/
