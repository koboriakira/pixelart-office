#!/usr/bin/env bash
# Pixel Art Office — Claude Code Hook インストーラー
#
# 使い方: bash examples/install-hooks.sh
#
# ~/.claude/settings.json に Pixel Art Office 用の Hook 設定を追加します。
# 既存の設定がある場合はマージします。

set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"

mkdir -p "$(dirname "$SETTINGS")"

# 設定ファイルがなければ空オブジェクトで初期化
if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi

# jq が必要
if ! command -v jq &>/dev/null; then
  echo "エラー: jq が必要です。brew install jq でインストールしてください。"
  exit 1
fi

# Hook コマンドのテンプレート（サーバー未起動時は無視）
hook_cmd() {
  local event="$1"
  local extra="${2:-}"
  echo "REPO=\$(basename \"\$(git rev-parse --show-toplevel 2>/dev/null || echo unknown)\"); curl -sf --max-time 1 -X POST http://localhost:3100/api/events -H 'Content-Type: application/json' -d \"{\\\\\"agent_id\\\\\":\\\\\"claude-\${REPO}-main\\\\\",\\\\\"event\\\\\":\\\\\"${event}\\\\\",\\\\\"provider\\\\\":\\\\\"claude\\\\\"${extra}}\" >/dev/null 2>&1 || true"
}

# Hook 設定を JSON として構築
HOOKS_JSON=$(jq -n \
  --arg session_start "$(hook_cmd session_start)" \
  --arg pre_tool "$(hook_cmd tool_use_start ',\\\\\"tool\\\\\":\\\\\"$CLAUDE_TOOL_NAME\\\\\"')" \
  --arg post_tool "$(hook_cmd tool_use_end)" \
  --arg stop "$(hook_cmd session_stop)" \
  '{
    hooks: {
      SessionStart: [{ matcher: "", hooks: [{ type: "command", command: $session_start }] }],
      PreToolUse: [{ matcher: "*", hooks: [{ type: "command", command: $pre_tool }] }],
      PostToolUse: [{ matcher: "*", hooks: [{ type: "command", command: $post_tool }] }],
      Stop: [{ matcher: "", hooks: [{ type: "command", command: $stop }] }]
    }
  }')

# 既存設定とマージ（hooks キーを deep merge）
MERGED=$(jq -s '.[0] * .[1]' "$SETTINGS" <(echo "$HOOKS_JSON"))
echo "$MERGED" > "$SETTINGS"

echo "Hook 設定を $SETTINGS に追加しました。"
echo ""
echo "確認:"
echo "  cat $SETTINGS | jq .hooks"
echo ""
echo "Pixel Art Office サーバーを起動するには:"
echo "  cd $(cd "$(dirname "$0")/.." && pwd)"
echo "  pnpm --filter server dev"
