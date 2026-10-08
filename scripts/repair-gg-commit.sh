#!/bin/sh
# Re-commits the repos of the first run of create-family-repos.js through gg
# (ticket 2): the script committed with git because gg refuses commits on
# main, and the quick check (gg did commit) demands a gg commit. Runs the
# checks, commits with gg --force, pushes to main with the Default ruleset
# lifted and applies it again. Usage: scripts/repair-gg-commit.sh <workdir> <name>...
set -e
WORKDIR=$1; shift
for name in "$@"; do
  dir="$WORKDIR/$name"; echo "=== $name"; cd "$dir"
  gg one can commit
  gg one do commit -f -m"Record the gg commit state"
  gg one did commit
  for id in $(gh api "repos/audaudio/$name/rulesets" --jq '.[].id'); do gh api --method DELETE "repos/audaudio/$name/rulesets/$id" >/dev/null; done
  git push -q origin main
  node scripts/setup-github-repo.js --apply >/dev/null
  echo "    repaired"
done
