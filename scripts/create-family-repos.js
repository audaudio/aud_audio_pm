/*
 * @license
 * Copyright (c) Audanika. All Rights Reserved.
 *
 * Use of this source code is governed by terms that can be
 * found in the LICENSE file in the root of this package.
 */

// Creates the repos of the aud_audio family from the package manifest
// doc/2026-Q4/architecture/packages.jsonc (ticket 2, decision repos-001):
// GitHub repo, template, dna_audanika layer, pubspec with git references,
// boilerplate files, initial commit, tag 0.0.1, GitHub ruleset.
//
// Usage:
//   node scripts/create-family-repos.js                  dry run, prints the plan
//   node scripts/create-family-repos.js --apply          creates everything
//   node scripts/create-family-repos.js --apply --only aud_audio_core,aud_audio_graph
//   node scripts/create-family-repos.js --local-only --only aud_audio_core
//                                                        template + files, no GitHub
// Options:
//   --workdir <dir>         where the repos are cloned and built (default: ../.repos)
//   --docs-template <dir>   the adapted copy of rljson.github.io for the docs repo

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const apply = flag('--apply');
const localOnly = flag('--local-only');
const only = option('--only', '').split(',').filter(Boolean);
const workdir = resolve(root, option('--workdir', '../.repos'));
const docsTemplate = option('--docs-template', '');
const today = new Date().toISOString().slice(0, 10);

// ...........................................................................
const log = (msg) => console.log(msg);
const run = (cmd, cwd = root, opts = {}) => {
  log(`    $ ${cmd}`);
  return execSync(cmd, { cwd, stdio: opts.capture ? 'pipe' : 'inherit', encoding: 'utf8', ...opts });
};
const tryRun = (cmd, cwd) => {
  try {
    return run(cmd, cwd, { capture: true, stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
};

// ...........................................................................
// The manifest, with its comments stripped
const manifestText = readFileSync(join(root, 'doc/2026-Q4/architecture/packages.jsonc'), 'utf8')
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('//'))
  .join('\n');
const manifest = JSON.parse(manifestText);
const org = manifest.organization;
const version = manifest.version;
const byName = Object.fromEntries(manifest.packages.map((p) => [p.name, p]));

// Topological order: dependencies first
const ordered = [];
const visit = (p, stack = new Set()) => {
  if (ordered.includes(p)) return;
  if (stack.has(p.name)) throw new Error(`Cycle at ${p.name}`);
  stack.add(p.name);
  for (const d of p.deps) if (byName[d]) visit(byName[d], stack);
  ordered.push(p);
};
manifest.packages.forEach((p) => visit(p));
const selected = ordered.filter((p) => !only.length || only.includes(p.name));

// ...........................................................................
const camel = (s) => s.replace(/[_.-](\w)/g, (_, c) => c.toUpperCase());
const header = (comment) =>
  [
    `${comment} @license`,
    `${comment} Copyright (c) Audanika. All Rights Reserved.`,
    `${comment}`,
    `${comment} Use of this source code is governed by terms that can be`,
    `${comment} found in the LICENSE file in the root of this package.`,
  ].join('\n');

const gitattributes = `* text=auto eol=lf
.gg/.gg.json merge=ours
pubspec.lock merge=ours
.gg/gg.json merge=ours
CHANGELOG.md merge=union
`;
const gitignoreExtra = `
node_modules
coverage
build
*.vm.json
.DS_Store
.gg/*
!.gg/gg.json
.gg/publish_config.json
.gg/publish_state.json
.gg/gg-publish.json
.gg/pubspec_overrides_backup.yaml
.gg/pnpm_workspace_backup.yaml
`;

const templateCommand = (p) => {
  switch (p.template) {
    case 'dart':
      return `dart create -t package ${p.name} --no-pub`;
    case 'ffi':
      return `flutter create --template=package_ffi --org com.audanika ${p.name}`;
    case 'flutter':
      return `flutter create -t package --org com.audanika ${p.name}`;
    case 'app':
      return `flutter create --org com.audanika --platforms=ios,android --project-name ${p.name} ${p.name}`;
    case 'docs':
      return `cp -R ${docsTemplate || '<docs-template>'} ${p.name}`;
    default:
      throw new Error(`Unknown template ${p.template} of ${p.name}`);
  }
};
const pubTool = (p) => (p.template === 'flutter' || p.template === 'app' ? 'flutter' : 'dart');
const depDescriptor = (dep) => {
  const ext = manifest.external[dep];
  const url = ext ? ext.git : `https://github.com/${org}/${dep}.git`;
  const range = ext ? ext.version : `^${version}`;
  return JSON.stringify({ git: { url, tag_pattern: '{{version}}' }, version: range });
};

// ...........................................................................
const writeBoilerplate = (p, dir) => {
  const name = p.name;
  writeFileSync(join(dir, '.gitattributes'), gitattributes);
  const gi = join(dir, '.gitignore');
  writeFileSync(gi, (existsSync(gi) ? readFileSync(gi, 'utf8') : '') + gitignoreExtra);
  writeFileSync(join(dir, 'CHANGELOG.md'), '# Changelog\n\n## Unreleased\n\n### Added\n\n- Initial boilerplate\n');
  writeFileSync(
    join(dir, 'index.jsonc'),
    `${header('//')}\n\n${JSON.stringify(
      {
        name,
        summary: p.description + '.',
        domain: [p.description.split(':')[0]],
        interfaces: {
          uses: Object.fromEntries(p.deps.map((d) => [d, 'package dependency'])),
          usedBy: Object.fromEntries(
            manifest.packages.filter((q) => q.deps.includes(name)).map((q) => [q.name, 'consumes this package']),
          ),
        },
      },
      null,
      2,
    )}\n`,
  );
  if (p.template !== 'docs') {
    writeFileSync(
      join(dir, 'README.md'),
      `# ${name}\n\n${p.description}.\n\nPart of the Audanika Audio Engine; planned in [aud_audio_pm](https://github.com/${org}/aud_audio_pm).\n`,
    );
  }
  writeFileSync(
    join(dir, 'README.de.md'),
    `# ${name}\n\n${p.description}.\n\nTeil der Audanika Audio Engine; geplant in [aud_audio_pm](https://github.com/${org}/aud_audio_pm).\n`,
  );
  if (p.template === 'docs') return;
  writeFileSync(join(dir, 'check.yaml'), 'analyze:\n  execute: true\nformat:\n  execute: true\ntests:\n  execute: true\npana:\n  execute: false\n');
  const constName = `${camel(name)}Version`;
  mkdirSync(join(dir, 'lib/src'), { recursive: true });
  writeFileSync(
    join(dir, `lib/src/${name}_version.dart`),
    `${header('//')}\n\n// GENERATED BY gg_version WriteVersionFile - DO NOT EDIT.\n// Kept in sync by test/${name}_version_test.dart.\n// coverage:ignore-file\n\n/// The version of the \`${name}\` package.\nconst String ${constName} = '${version}';\n`,
  );
  mkdirSync(join(dir, 'test'), { recursive: true });
  writeFileSync(
    join(dir, `test/${name}_version_test.dart`),
    `${header('//')}\n\nimport 'dart:io';\n\nimport 'package:${pubTool(p) === 'flutter' ? 'flutter_test/flutter_test' : 'test/test'}.dart';\n\n// GENERATED BY gg_version WriteVersionFile - DO NOT EDIT.\n//\n// Repairs the version literal in\n// lib/src/${name}_version.dart\n// when it drifts from pubspec.yaml. Drift is not an error here: the literal\n// is rewritten and the test passes.\n\nvoid main() {\n  group('${name}_version.dart', () {\n    test('matches the version in pubspec.yaml', () {\n      const declaration = 'const String ${constName} = ';\n      final match = RegExp(\n        r'^version:\\s*(\\S+)\\s*$',\n        multiLine: true,\n      ).firstMatch(File('pubspec.yaml').readAsStringSync());\n      expect(match, isNotNull, reason: 'no version in pubspec.yaml');\n\n      final expected = "$declaration'\${match!.group(1)}';";\n      final file = File('lib/src/${name}_version.dart');\n\n      if (!file.readAsStringSync().contains(expected)) {\n        file.writeAsStringSync(\n          file.readAsStringSync().replaceFirst(\n            RegExp("$declaration'[^']*';"),\n            expected,\n          ),\n        );\n      }\n\n      expect(file.readAsStringSync(), contains(expected));\n    });\n  });\n}\n`,
  );
  // The Dart package template ships a placeholder library; gg demands a test
  // per lib/src file, so the placeholder goes and the library exports the
  // version file until the first implementation ticket.
  if (p.template === 'dart') {
    for (const f of [`lib/src/${name}_base.dart`, `test/${name}_test.dart`, `test/${name}_base_test.dart`]) {
      if (existsSync(join(dir, f))) rmSync(join(dir, f));
    }
    rmSync(join(dir, 'example'), { recursive: true, force: true });
    writeFileSync(
      join(dir, `lib/${name}.dart`),
      `${header('//')}\n\n/// ${p.description}.\nlibrary;\n\nexport 'src/${name}_version.dart';\n`,
    );
  }
  // The app template's counter demo has no test covering main(); gg demands
  // coverage, so the app starts minimal with a test that calls main().
  if (p.template === 'app') {
    rmSync(join(dir, 'test/widget_test.dart'), { force: true });
    const cls = `${camel(name).replace(/^./, (c) => c.toUpperCase())}App`;
    writeFileSync(
      join(dir, 'lib/main.dart'),
      `${header('//')}\n\nimport 'package:flutter/material.dart';\n\nvoid main() => runApp(const ${cls}());\n\n/// ${p.description}.\nclass ${cls} extends StatelessWidget {\n  /// Creates the app.\n  const ${cls}({super.key});\n\n  @override\n  Widget build(BuildContext context) => const MaterialApp(\n    title: '${name}',\n    home: Scaffold(body: Center(child: Text('${name}'))),\n  );\n}\n`,
    );
    writeFileSync(
      join(dir, 'test/main_test.dart'),
      `${header('//')}\n\nimport 'package:${name}/main.dart' as app;\nimport 'package:flutter_test/flutter_test.dart';\n\nvoid main() {\n  testWidgets('main shows the app', (tester) async {\n    app.main();\n    await tester.pumpAndSettle();\n    expect(find.text('${name}'), findsOneWidget);\n  });\n}\n`,
    );
  }
  // The package_ffi template prints from its build hook, which the lints forbid
  const hook = join(dir, 'hook/build.dart');
  if (existsSync(hook)) {
    let t = readFileSync(hook, 'utf8');
    if (!t.includes("import 'dart:io';")) t = `import 'dart:io';\n\n${t}`;
    t = t.replace('print(record.message)', 'stdout.writeln(record.message)');
    writeFileSync(hook, t);
  }
};

const patchPubspec = (p, dir) => {
  const path = join(dir, 'pubspec.yaml');
  let s = readFileSync(path, 'utf8');
  s = s.replace(/^description:.*$/m, `description: "${p.description}"`);
  s = s.replace(/^version:.*$/m, `version: ${version}`);
  s = s.replace(/^homepage:.*\n/m, '');
  s = s.replace(/^# repository:.*\n/m, '');
  const publishTo = /^publish_to:/m.test(s) ? '' : 'publish_to: none\n';
  s = s.replace(/^(version: [^\n]+\n)/m, `$1${publishTo}homepage: https://github.com/${org}/${p.name}\nrepository: https://github.com/${org}/${p.name}\n`);
  s = s.replace(/^  sdk: \^3\.\d+\.\d+$/m, '  sdk: ^3.12.2');
  writeFileSync(path, s);
};

// ...........................................................................
const remoteHasCommits = (name) => tryRun(`gh api repos/${org}/${name}/commits?per_page=1 --jq 'length'`) === '1';
const remoteExists = (name) => tryRun(`gh repo view ${org}/${name} --json name --jq .name`) === name;

const createOne = (p) => {
  const name = p.name;
  const dir = join(workdir, name);
  log(`\n=== ${name} (${p.template}) deps: ${p.deps.join(', ') || 'none'}`);
  if (!localOnly) {
    if (remoteHasCommits(name)) {
      log('    exists with commits on GitHub, skipped');
      return 'skipped';
    }
    if (!remoteExists(name)) {
      run(`gh repo create ${org}/${name} --public --description "${p.description}" --homepage https://audaudio.github.io`);
    } else {
      log('    exists on GitHub but is empty, filling it');
    }
  }
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(workdir, { recursive: true });
  run(templateCommand(p), workdir);
  if (p.template !== 'docs') {
    writeFileSync(join(dir, '.gitattributes'), gitattributes);
    run('git init -q -b main', dir);
    run('git add -A && git commit -q -m "Template"', dir);
    run('gg dna init', dir);
    run('gg dna add dna_audanika', dir);
    patchPubspec(p, dir);
    const tool = pubTool(p);
    for (const d of p.deps) run(`${tool} pub add '${d}:${depDescriptor(d)}'`, dir);
    writeBoilerplate(p, dir);
    run(`${tool} pub get`, dir);
    run('dart format .', dir);
  } else {
    writeBoilerplate(p, dir);
    run('git init -q -b main', dir);
    run('pnpm install', dir);
  }
  run('git add -A', dir);
  // gg refuses to commit on main; the first commit of a fresh repo belongs
  // there, so the checks run through gg and the commit through git.
  // gg records the commit in .gg/gg.json, which the quick check verifies;
  // --force lets gg commit on main (the checks ran the line before).
  const green = tryRun('gg one can commit', dir) !== null;
  if (green) {
    run('gg one do commit -f -m"Initial boilerplate"', dir);
  } else {
    log('    !! gg one can commit is red; committed with git, fix the repo by hand');
    run('git add -A && git commit -q -m "Initial boilerplate"', dir);
  }
  if (localOnly) return green ? 'local' : 'local, checks red';
  run(`git remote add origin git@github.com:${org}/${name}.git`, dir);
  run('git push -q -u origin main', dir);
  run(`git tag ${version} && git push -q origin ${version}`, dir);
  if (existsSync(join(dir, 'scripts/setup-github-repo.js'))) {
    run('node scripts/setup-github-repo.js --apply', dir);
  }
  return 'created';
};

// ...........................................................................
log(`${selected.length} package(s) in dependency order:`);
for (const p of selected) log(`  ${p.name.padEnd(26)} ${p.template.padEnd(8)} <- ${p.deps.join(', ') || '-'}`);
if (!apply && !localOnly) {
  log('\nDry run. Add --apply to create the repos, or --local-only to build them locally.');
  process.exit(0);
}
const results = {};
for (const p of selected) {
  try {
    results[p.name] = createOne(p);
  } catch (e) {
    results[p.name] = `FAILED: ${e.message.split('\n')[0]}`;
    log(`    !! ${results[p.name]}`);
    if (!flag('--continue')) break;
  }
}
log('\nSummary:');
for (const [n, r] of Object.entries(results)) log(`  ${n.padEnd(26)} ${r}`);
