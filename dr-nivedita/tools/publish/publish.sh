#!/usr/bin/env bash
# Publish the site to GitHub Pages: export the running local server (http://localhost:3000)
# to static files, then force-push them to the gh-pages branch. Also pushes the source (main).
# Live at https://namanjajoria.github.io/dr-nivedita-dadu-website/ a minute or two later.
# Usage (from anywhere, with the local server running):  bash publish.sh "what changed"
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
DIST="$HERE/dist"
MSG="${1:-Update website}"
REMOTE="https://github.com/namanjajoria/dr-nivedita-dadu-website.git"
AUTHOR=(-c user.name="namanjajoria" -c user.email="123818706+namanjajoria@users.noreply.github.com")

curl -sf -o /dev/null http://localhost:3000/ || { echo "Start the local server first (START-WEBSITE.bat)"; exit 1; }
node "$HERE/export-static.js" "$DIST"

# source -> main
cd "$ROOT"
git add -A
if ! git diff --cached --quiet; then git "${AUTHOR[@]}" commit -q -m "$MSG"; fi
git push -q origin main

# built site -> gh-pages (a fresh single-commit branch each time, so the repo stays small)
cd "$DIST"
rm -rf .git
git init -q -b gh-pages
git config core.autocrlf false
git add -A
git "${AUTHOR[@]}" commit -q -m "$MSG"
git push -q -f "$REMOTE" gh-pages
rm -rf .git
echo "Published: https://namanjajoria.github.io/dr-nivedita-dadu-website/"
