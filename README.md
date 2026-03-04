# Pixel Art Office

AIエージェント（Claude Code、GitHub Copilot 等）のリアルタイム状態を、ピクセルアートのオフィス画面で可視化する。

## セットアップ

```bash
git clone git@github.com:koboriakira/pixelart-office.git
cd pixelart-office
pnpm install
```

## 起動

```bash
# サーバー + フロントを同時起動
pnpm dev

# または個別に起動
pnpm --filter server dev   # http://localhost:3100
pnpm --filter web dev      # http://localhost:5173
```

ブラウザで http://localhost:5173 を開く。

## Claude Code Hook 設定

Claude Code のセッション開始/ツール使用/終了イベントを自動送信する:

```bash
bash examples/install-hooks.sh
```

これにより `~/.claude/settings.json` に Hook が追加される。サーバーが停止中でも Claude Code の動作に影響しない。

### アンインストール

Hook 設定を削除し、ヘルパースクリプトを除去する:

```bash
bash examples/uninstall-hooks.sh
```

他の Hook 設定（Notification 等）には影響しない。

### エージェントID 規則

`claude-{リポジトリ名}-{エージェント名}` の形式で自動生成される。

例: リポジトリ `my-app` のメインセッション → `claude-my-app-main`

### 手動テスト

```bash
# イベント送信
curl -X POST http://localhost:3100/api/events \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"claude-test-main","event":"session_start","provider":"claude"}'

# エージェント確認
curl http://localhost:3100/api/agents
```

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React + PixiJS 8 + Vite |
| バックエンド | Hono + better-sqlite3 + WebSocket |
| 共通型定義 | TypeScript |
| パッケージマネージャ | pnpm workspace |
