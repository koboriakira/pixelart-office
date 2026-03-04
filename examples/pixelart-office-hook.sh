#!/usr/bin/env bash
# Pixel Art Office — Hook ヘルパースクリプト
#
# 使い方: pixelart-office-hook.sh <event> [tool_name]
#
# エージェントID: claude-{リポジトリ名}-main
# サーバー未起動時は静かに無視する

EVENT="${1:?usage: pixelart-office-hook.sh <event> [tool_name]}"
TOOL="${2:-}"

REPO=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || echo unknown)")
AGENT_ID="claude-${REPO}-main"

JSON="{\"agent_id\":\"${AGENT_ID}\",\"event\":\"${EVENT}\",\"provider\":\"claude\""
if [ -n "$TOOL" ]; then
  JSON="${JSON},\"tool\":\"${TOOL}\""
fi
JSON="${JSON}}"

curl -sf --max-time 1 -X POST http://localhost:3100/api/events \
  -H 'Content-Type: application/json' \
  -d "$JSON" >/dev/null 2>&1 || true
