#!/usr/bin/env bash
# فحص سريع بعد أي تعديل: صياغة PHP و JavaScript
set -euo pipefail
cd "$(dirname "$0")/.."
for f in api/*.php; do php -l "$f" >/dev/null && echo "✓ $f"; done
for f in js/*.js admin/*.js; do node -e "new Function(require('fs').readFileSync('$f','utf8'))" && echo "✓ $f"; done
echo "OK"
