#!/bin/sh
set -eu
project_root=$(git rev-parse --show-toplevel)
cd "$project_root"
[ "$(git branch --show-current)" = main ] || { echo '請切換到 main 再發布。' >&2; exit 1; }
[ "$(git remote get-url origin)" = 'https://github.com/harrylin0312/apex-formula.git' ] || { echo 'origin 不符合正式專案。' >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo '請先確認並提交工作目錄的修改。' >&2; exit 1; }
node --check dist/core.js
node --check dist/game.js
node --check dist/touch-controls.js
node --check dist/engine-audio.js
node tests/touch-controls.test.mjs
node tests/engine-audio.test.mjs
node --check dist/tyre-smoke.js
node tests/tyre-smoke.test.mjs
node --check dist/car-model.js
node tests/car-model.test.mjs >/dev/null
node tests/physics.test.mjs >/dev/null
git push origin main
pages_commit=$(git subtree split --prefix=dist main)
git push origin "$pages_commit:refs/heads/gh-pages"
echo "Pages source commit: $pages_commit"
echo '檢查 GitHub Pages 建置成功後，再回報發布完成。'
