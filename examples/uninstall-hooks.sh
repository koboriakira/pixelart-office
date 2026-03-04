#!/usr/bin/env bash
# Pixel Art Office — Claude Code Hook アンインストーラー
#
# 使い方: bash examples/uninstall-hooks.sh
#
# 1. ~/.claude/settings.json から pixelart-office 関連の Hook を削除
# 2. ~/.local/bin/pixelart-office-hook.sh を削除

set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"
HOOK_SCRIPT="$HOME/.local/bin/pixelart-office-hook.sh"

if ! command -v jq &>/dev/null; then
  echo "エラー: jq が必要です。brew install jq でインストールしてください。"
  exit 1
fi

# settings.json から pixelart-office-hook.sh を含む Hook エントリを除去
if [ -f "$SETTINGS" ]; then
  CLEANED=$(jq '
    .hooks |= (if . then
      to_entries | map(
        .value |= map(
          .hooks |= map(select(.command | test("pixelart-office") | not))
          | select(.hooks | length > 0)
        )
        | select(.value | length > 0)
      ) | from_entries
    else . end)
  ' "$SETTINGS")
  echo "$CLEANED" > "$SETTINGS"
  echo "Hook 設定を $SETTINGS から削除しました。"
else
  echo "$SETTINGS が見つかりません。スキップします。"
fi

# ヘルパースクリプトを削除
if [ -f "$HOOK_SCRIPT" ]; then
  rm "$HOOK_SCRIPT"
  echo "ヘルパースクリプト $HOOK_SCRIPT を削除しました。"
else
  echo "$HOOK_SCRIPT は存在しません。スキップします。"
fi

echo ""
echo "確認: cat $SETTINGS | jq .hooks"
