#!/usr/bin/env bash
# Pixel Art Office — Claude Code Hook インストーラー
#
# 使い方: bash examples/install-hooks.sh
#
# 1. pixelart-office-hook.sh を ~/.local/bin/ にコピー
# 2. ~/.claude/settings.json に Hook 設定を追加

set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"
HOOK_SCRIPT="$HOME/.local/bin/pixelart-office-hook.sh"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ヘルパースクリプトをインストール
mkdir -p "$(dirname "$HOOK_SCRIPT")"
cp "$SCRIPT_DIR/pixelart-office-hook.sh" "$HOOK_SCRIPT"
chmod +x "$HOOK_SCRIPT"
echo "ヘルパースクリプトを $HOOK_SCRIPT にインストールしました。"

# settings.json の準備
mkdir -p "$(dirname "$SETTINGS")"
if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi

if ! command -v jq &>/dev/null; then
  echo "エラー: jq が必要です。brew install jq でインストールしてください。"
  exit 1
fi

# Hook 設定を構築（ヘルパースクリプト呼び出し方式 — エスケープ不要）
HOOKS_JSON=$(jq -n \
  --arg hook "$HOOK_SCRIPT" \
  '{
    hooks: {
      SessionStart: [{ matcher: "", hooks: [{ type: "command", command: ($hook + " session_start") }] }],
      PreToolUse: [{ matcher: "*", hooks: [{ type: "command", command: ($hook + " tool_use_start $CLAUDE_TOOL_NAME") }] }],
      PostToolUse: [{ matcher: "*", hooks: [{ type: "command", command: ($hook + " tool_use_end") }] }],
      Stop: [{ matcher: "", hooks: [{ type: "command", command: ($hook + " session_stop") }] }]
    }
  }')

# 既存設定とマージ
MERGED=$(jq -s '.[0] * .[1]' "$SETTINGS" <(echo "$HOOKS_JSON"))
echo "$MERGED" > "$SETTINGS"

echo "Hook 設定を $SETTINGS に追加しました。"
echo ""
echo "確認: cat $SETTINGS | jq .hooks"
echo ""
echo "サーバー起動: cd $SCRIPT_DIR/.. && pnpm --filter server dev"
