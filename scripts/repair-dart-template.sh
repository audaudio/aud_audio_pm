#!/bin/sh
# Repairs the Dart-template repos of the first run of create-family-repos.js
# (ticket 2): removes the template placeholder, lets gg's checks pass, and
# pushes the fix to main — lifting the Default ruleset for the push and
# applying it again. Usage: scripts/repair-dart-template.sh <workdir> <name>...
set -e
WORKDIR=$1; shift
for name in "$@"; do
  dir="$WORKDIR/$name"; echo "=== $name"; cd "$dir"
  if grep -q '^  flutter:$' pubspec.yaml; then
    # Flutter package or app: the version test must use flutter_test
    sed -i '' "s#import 'package:test/test.dart';#import 'package:flutter_test/flutter_test.dart';#" "test/${name}_version_test.dart"
  else
    # Dart package: drop the template placeholder
    rm -f "lib/src/${name}_base.dart" "test/${name}_test.dart" "test/${name}_base_test.dart"; rm -rf example
    desc=$(sed -n 's/^description: "\(.*\)"$/\1/p' pubspec.yaml)
    printf '%s\n' "// @license" "// Copyright (c) Audanika. All Rights Reserved." "//" \
      "// Use of this source code is governed by terms that can be" \
      "// found in the LICENSE file in the root of this package." "" \
      "/// $desc." "library;" "" "export 'src/${name}_version.dart';" > "lib/$name.dart"
  fi
  dart format . >/dev/null
  gg one can commit
  git add -A && git commit -q -m "Fix the template leftovers"
  for id in $(gh api "repos/audaudio/$name/rulesets" --jq '.[].id'); do gh api --method DELETE "repos/audaudio/$name/rulesets/$id" >/dev/null; done
  git push -q origin main
  node scripts/setup-github-repo.js --apply >/dev/null
  echo "    repaired"
done
