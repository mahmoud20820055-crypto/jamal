#!/usr/bin/env bash
# اختبار كامل: زائر يبعت ← رد تلقائي ← المدير يرد ← الزائر يشوف الرد
# يحتاج: php (مع pdo_sqlite) + node + playwright
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; OUT="${1:-$TMP/shots}"; mkdir -p "$OUT"
mkdir -p "$TMP/site" && cp -r "$ROOT/." "$TMP/site/" && rm -rf "$TMP/site/.git" "$TMP/site/tests"
rm -f "$TMP"/site/data/*.sqlite*
sed -i "s/'CHANGE-ME-before-upload',/'test-key-123',/" "$TMP/site/api/config.php"
php -S 127.0.0.1:8099 -t "$TMP/site" > "$TMP/php.log" 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null' EXIT; sleep 1
node "$ROOT/tests/e2e.js" "$OUT"
node "$ROOT/tests/cart-e2e.js" "$OUT"
echo "Screenshots: $OUT"
