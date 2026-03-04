# Pixel Art Office

AIエージェント（Claude Code、GitHub Copilot 等）のリアルタイム状態を、ピクセルアートのオフィス画面で可視化するアプリ。

## 技術スタック

- **モノレポ**: pnpm workspace
- **バックエンド** (`packages/server`): Hono + better-sqlite3 + WebSocket (ws)
- **フロントエンド** (`packages/web`): React + PixiJS 8 + Vite
- **共通型定義** (`packages/shared`): TypeScript 型・定数
- **言語**: TypeScript（全レイヤー）

## 開発コマンド

```bash
pnpm install                    # 依存インストール
pnpm dev                        # server + web 同時起動
pnpm --filter server dev        # サーバーのみ (port 3100)
pnpm --filter web dev           # フロントのみ (port 5173)
pnpm lint                       # ESLint
pnpm test                       # Vitest
```

## プロジェクト構成

```
packages/
  shared/src/types.ts    # EventPayload, Agent, Department 等の共通型
  server/src/
    index.ts             # Hono エントリポイント (port 3100)
    db.ts                # SQLite セットアップ
    routes/              # REST API ルート
    ws/hub.ts            # WebSocket ブロードキャスト
  web/src/
    App.tsx              # React エントリ
    components/
      office-view/       # PixiJS オフィス描画
    hooks/               # React hooks (useWebSocket 等)
```

## API

- `POST /api/events` — エージェントイベント受信（Hook連携）
- `GET /api/agents` — エージェント一覧
- `GET /api/departments` — 部門一覧
- `ws://localhost:3100/ws` — リアルタイムブロードキャスト

## ブランチ命名規則

`feat/issue-{番号}-{slug}` (例: `feat/issue-2-sqlite-setup`)
