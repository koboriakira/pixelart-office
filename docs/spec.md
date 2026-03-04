# Pixel Art Office — ミニマム仕様書 v0.1

## 1. プロダクト概要

### 目的

AIエージェント（Claude Code、GitHub Copilot 等）のリアルタイム状態を、ピクセルアートのオフィス画面で可視化する。

### 対象ユーザー

Claude Code + GitHub Copilot を併用する個人開発者。

### コアバリュー

**複数エージェントの状態を 0.5 秒で把握できる。**

- 誰が（どのエージェントが）
- どの部門で（どのルームに所属して）
- 今何をしているか（idle / working / offline）

をピクセルアートオフィスの視覚表現で即座に認識できる。

---

## 2. 技術スタック

| レイヤー | 技術 | 選定理由 |
|----------|------|----------|
| フロントエンド | React + PixiJS 8 + Vite | claw-empire で実績あり。PixiJS はピクセルアートのスプライトアニメーション・タイル描画に最適。Vite は高速な HMR を提供 |
| バックエンド | Hono + better-sqlite3 | Hono は軽量で TypeScript ネイティブ。SQLite は個人利用に十分でインフラ不要 |
| リアルタイム通信 | WebSocket | claw-empire と同方式。低レイテンシで状態変更を即座にブロードキャスト |
| パッケージマネージャ | pnpm | ワークスペース管理が容易。claw-empire と統一 |
| 言語 | TypeScript（全レイヤー） | 型安全性と開発体験 |

---

## 3. エージェント状態検知

### アプローチ比較

| アプローチ | 概要 | メリット | デメリット |
|-----------|------|---------|-----------|
| **A. プロセス監視** | `ps` / proc でCLIプロセスを検出 | 自動、追加設定不要 | stdout 解析が困難、精度に限界、ポーリング負荷 |
| **B. サーバー経由タスク実行** | サーバーが CLI を spawn して完全制御（claw-empire 方式） | 完全制御、ログ取得可能、イベント粒度が細かい | CLI の直接利用ができなくなる、既存ワークフロー破壊 |
| **C. Hook/イベント連携** | Claude Code の Hook 機能 + Copilot 拡張でイベント送信 | 既存ワークフロー維持、正確、軽量 | 各ツール側の設定が必要 |

### 推奨: C（Hook/イベント連携）

**理由:**

1. **既存ワークフローを変えない** — ユーザーは普段どおり Claude Code や Copilot を直接使い続けられる
2. **Claude Code は Hook 機能を標準サポート** — `notification` hook でイベント発火が可能。`PreToolUse` / `PostToolUse` / `Stop` 等のフックポイントでエージェントの活動状態を検知できる
3. **正確な状態取得** — プロセス監視と違い、ツール側が明示的にイベントを送信するため誤検知がない
4. **最小構成で開始可能** — Claude Code 用の hook 設定ファイルと、`POST /api/events` への curl で最小限動作する

### Hook 連携の具体的な仕組み

#### Claude Code

`.claude/settings.json` に hook を設定:

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:3100/api/events -H 'Content-Type: application/json' -d '{\"agent_id\":\"claude-main\",\"event\":\"tool_use_start\",\"tool\":\"$TOOL_NAME\"}'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://localhost:3100/api/events -H 'Content-Type: application/json' -d '{\"agent_id\":\"claude-main\",\"event\":\"session_stop\"}'"
          }
        ]
      }
    ]
  }
}
```

#### GitHub Copilot

VS Code 拡張として Event Forwarder を実装（Phase 2 以降）:
- Copilot Chat のアクティビティを検知して同じ `POST /api/events` に送信
- または VS Code の `onDidChangeTextDocument` イベントで間接的に活動を検知

#### 汎用 CLI ツール

任意の CLI ツールから `curl` で直接 `POST /api/events` を叩くことで対応可能。

---

## 4. データモデル

### agents テーブル

```sql
CREATE TABLE agents (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  provider      TEXT NOT NULL CHECK (provider IN ('claude', 'copilot', 'other')),
  status        TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('idle', 'working', 'offline')),
  current_task  TEXT,
  department_id TEXT REFERENCES departments(id),
  sprite_number INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### departments テーブル

```sql
CREATE TABLE departments (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#5a9fd4',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### activity_log テーブル

```sql
CREATE TABLE activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id   TEXT NOT NULL REFERENCES agents(id),
  event_type TEXT NOT NULL,
  payload    TEXT,  -- JSON
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_activity_log_agent ON activity_log(agent_id, created_at);
```

---

## 5. API 設計

### REST エンドポイント

#### `POST /api/events` — エージェントイベント受信

Hook 連携のメインエンドポイント。エージェントからの状態変更イベントを受信する。

```typescript
// Request
interface EventPayload {
  agent_id: string;
  event: 'tool_use_start' | 'tool_use_end' | 'session_start' | 'session_stop' | 'heartbeat';
  tool?: string;
  task?: string;
  metadata?: Record<string, unknown>;
}

// Response
{ ok: true }
```

**サーバー側の処理:**
1. `agent_id` で agents テーブルを upsert
2. イベント種別に応じて `status` を更新（`session_start` → `idle`、`tool_use_start` → `working`、`session_stop` → `offline`）
3. `activity_log` に記録
4. WebSocket で全クライアントにブロードキャスト

#### `GET /api/agents` — エージェント一覧

```typescript
// Response
interface AgentsResponse {
  agents: Array<{
    id: string;
    name: string;
    provider: 'claude' | 'copilot' | 'other';
    status: 'idle' | 'working' | 'offline';
    current_task: string | null;
    department_id: string | null;
    sprite_number: number;
    updated_at: number;
  }>;
}
```

#### `GET /api/departments` — 部門一覧

```typescript
// Response
interface DepartmentsResponse {
  departments: Array<{
    id: string;
    name: string;
    theme_color: string;
    sort_order: number;
    agents: Array<{ id: string; name: string; status: string }>;
  }>;
}
```

### WebSocket

#### `ws://localhost:3100/ws` — リアルタイムブロードキャスト

claw-empire の `createWsHub` パターンを踏襲。高頻度イベントはバッチ送信する。

```typescript
// サーバー → クライアント メッセージ形式
interface WsMessage {
  type: 'agent_status' | 'agent_event';
  payload: unknown;
  ts: number;  // Unix ms
}
```

---

## 6. オフィス描画仕様

### 参考実装（claw-empire）

本プロジェクトのピクセルアート描画は claw-empire の `src/components/office-view/` を参考にする。

| ファイル | 役割 |
|---------|------|
| `useOfficePixiRuntime.ts` | PixiJS Application の初期化・リサイズ管理 |
| `buildScene.ts` | シーン構築のオーケストレーター。レイアウト計算後、各レイヤー構築関数を順次呼び出す |
| `buildScene-departments.ts` | 部門ルームの描画。タイル床・壁・ドア・看板・家具・エージェント配置 |
| `buildScene-department-agent.ts` | エージェント個体の描画。スプライト・机・タスク吹き出し・サブクローン |
| `officeTicker.ts` | 毎フレームのアニメーションループ。CEO移動・パーティクル・時計更新 |
| `drawing-core.ts` | 基本描画ヘルパー。タイル床・壁・窓・時計・照明・ゴミ箱等 |
| `model.ts` | 定数（TILE=20px, SLOT_W=100, SLOT_H=120 等）・型定義・ユーティリティ |
| `themes-locale.ts` | テーマカラー定義（ライト/ダーク）・ロケール文字列 |

### 描画レイヤー構成

上から下の描画順（Z-order）:

```
1. フロア     — チェッカー模様のタイル床 (drawTiledFloor)
2. 壁・装飾   — 部屋の外枠、窓、照明、額縁、本棚 (drawRoomAtmosphere, drawWindow, etc.)
3. 家具       — デスク、椅子、ホワイトボード、植物 (drawDesk, drawChair, drawPlant, etc.)
4. エージェント — スプライトキャラクター + 名前タグ + ロールバッジ
5. エフェクト  — ステータスパーティクル、タスク吹き出し、通知バッジ
```

### グリッドシステム

claw-empire の定数を基本とする:

| 定数 | 値 | 説明 |
|------|---|------|
| `TILE` | 20px | タイル床の1マスサイズ |
| `SLOT_W` | 100px | エージェント1人分の横幅 |
| `SLOT_H` | 120px | エージェント1人分の縦幅 |
| `COLS_PER_ROW` | 3 | 1部屋あたりの列数 |
| `ROOM_PAD` | 16px | 部屋の内側パディング |
| `TARGET_CHAR_H` | 52px | エージェントキャラクターの高さ |
| `DESK_W` | 48px | デスクの幅 |
| `DESK_H` | 26px | デスクの高さ |

部門ルームはグリッド配置（最大3列）:
```
roomW = COLS_PER_ROW * SLOT_W + ROOM_PAD * 2  // 基本幅
```

### スプライトアニメーション

- **フォーマット**: スプライトシートから `{spriteNumber}-{direction}-{frame}` でフレーム取得
- **フレーム数**: 3フレーム立ちアニメーション（`AnimatedSprite`）
- **スケーリング**: `TARGET_CHAR_H / texture.height` で統一サイズに

### ステータスの視覚表現

| ステータス | 表現 |
|-----------|------|
| `idle` | 静止（アニメーション停止、通常描画） |
| `working` | パーティクルエフェクト — 10tick毎に星型パーティクルを生成。色: `[0x55aaff, 0x55ff88, 0xffaa33, 0xff5577, 0xaa77ff]`。上方に浮遊して35tick後にフェードアウト |
| `offline` | グレーアウト — `alpha: 0.3`, `tint: 0x888899` + 💤 絵文字表示 |

### プロバイダー別の視覚的区別

エージェントのプロバイダー（Claude / Copilot 等）を視覚的に区別する:

| プロバイダー | アクセントカラー | 識別要素 |
|-------------|----------------|---------|
| Claude | `#d97706`（アンバー系） | 名前タグの枠線色 |
| Copilot | `#16a34a`（グリーン系） | 名前タグの枠線色 |
| Other | `#6b7280`（グレー系） | 名前タグの枠線色 |

### タスク吹き出し

作業中のエージェントにはタスク名を表示する吹き出しを描画:
- キャラクター頭上に `💬 {タスク名}` を表示
- 16文字超は `...` で切り詰め
- 角丸の白背景 + テーマアクセント色のボーダー

### テーマ

claw-empire の `themes-locale.ts` を参考に、ライト/ダークモードを実装:

```typescript
// 部門テーマの型定義
type RoomTheme = {
  floor1: number;  // タイル色1
  floor2: number;  // タイル色2
  wall: number;    // 壁色
  accent: number;  // アクセント色
};
```

デフォルト部門テーマ（ライトモード）:

| 部門キー | floor1 | floor2 | wall | accent |
|---------|--------|--------|------|--------|
| dev | `#d8e8f5` | `#cce1f2` | `#6c96b7` | `#5a9fd4` |
| design | `#e8def2` | `#e1d4ee` | `#9378ad` | `#9a6fc4` |
| planning | `#f0e1c5` | `#eddaba` | `#ae9871` | `#d4a85a` |
| operations | `#d0eede` | `#c4ead5` | `#6eaa89` | `#5ac48a` |
| qa | `#f0cbcb` | `#edc0c0` | `#ae7979` | `#d46a6a` |

---

## 7. 画面構成

### メイン画面

```
┌──────────────────────────────────────────┐
│ [ヘッダー] 稼働中: 3/5  idle: 1  offline: 1 │
├──────────────────────────────────────────┤
│                                          │
│   ┌─── Dev Room ───┐  ┌─ Design Room ─┐ │
│   │ 🤖 Claude-1    │  │ 🤖 Copilot-1  │ │
│   │   ✨ working   │  │   💤 offline   │ │
│   │ 🤖 Claude-2    │  │               │ │
│   │   ✨ working   │  │               │ │
│   └────────────────┘  └───────────────┘ │
│                                          │
│   ┌─ Planning Room ─┐                   │
│   │ 🤖 Claude-3     │                   │
│   │   ⏸ idle        │                   │
│   └─────────────────┘                   │
│                                          │
└──────────────────────────────────────────┘
```

### ヘッダー

- 稼働中エージェント数のサマリー（working / idle / offline）
- ダークモード切替トグル

### オーバーレイ: エージェント詳細パネル

エージェントのスプライトをクリックするとスライドインパネルを表示:

```
┌─ Agent Detail ────────────┐
│ Name:     Claude-Main     │
│ Provider: Claude Code     │
│ Status:   Working         │
│ Task:     Fix login bug   │
│ Dept:     Dev Room        │
│                           │
│ Recent Activity:          │
│  14:23 tool_use: Edit     │
│  14:22 tool_use: Read     │
│  14:20 session_start      │
└───────────────────────────┘
```

---

## 8. MVP スコープ（Phase 1）

### 含むもの

- [ ] Hono サーバー + SQLite + WebSocket ハブ
- [ ] `POST /api/events` エンドポイント（Hook 連携受信）
- [ ] `GET /api/agents`, `GET /api/departments` エンドポイント
- [ ] PixiJS によるオフィス描画（フロア、壁、家具、エージェントスプライト）
- [ ] エージェントのステータス可視化（idle / working / offline）
- [ ] 部門ルームのグリッド配置
- [ ] プロバイダー別のカラーアクセント
- [ ] エージェントクリック → 詳細パネル表示
- [ ] Claude Code 用の Hook 設定サンプル
- [ ] ライト/ダークモード
- [ ] ヘッダーのサマリー表示

### 含まないもの

- タスク管理機能（タスクの作成・割り当て・進捗管理）
- 複数ユーザー対応・認証
- GitHub Copilot の自動検知（手動の curl で代替）
- サーバー経由のCLI実行（claw-empire の `cli-runtime.ts` 相当）
- CEO キャラクター・移動操作
- 会議システム（MeetingPresence）
- 休憩室
- サブエージェント（SubAgent）描画
- 配達アニメーション（CrossDeptDelivery）
- CLI使用量パネル
- i18n（日本語のみ）
- モバイル対応

---

## 9. 将来の拡張（Phase 2 以降）

### Phase 2: インタラクション強化

- **GitHub Copilot 自動検知** — VS Code 拡張で Copilot の活動を自動検知
- **タスク表示** — エージェントのタスク情報をより詳細に表示
- **アクティビティタイムライン** — エージェントの活動履歴をグラフ表示

### Phase 3: ゲーミフィケーション

- **CEO キャラクター** — WASD キーで移動。部門を巡回
- **休憩室** — idle 状態のエージェントが休憩室に移動するアニメーション
- **レベルシステム** — エージェントの作業量に応じた経験値・レベル

### Phase 4: コラボレーション

- **会議システム** — 複数エージェントの協調作業を会議テーブルで可視化
- **配達アニメーション** — 部門間のデータ受け渡しを表現
- **サブエージェント** — Claude Code のサブエージェント spawn を小型クローンで表示

### Phase 5: 運用

- **複数プロジェクト対応** — プロジェクトごとにオフィスフロアを分離
- **通知連携** — Slack / Discord への状態変更通知
- **ダッシュボード** — 日次/週次の稼働統計

---

## 付録: プロジェクト構成

```
pixel-office/
├── docs/
│   └── spec.md              # 本仕様書
├── packages/
│   ├── server/              # Hono + SQLite + WebSocket
│   │   ├── src/
│   │   │   ├── index.ts     # エントリポイント
│   │   │   ├── db.ts        # SQLite セットアップ
│   │   │   ├── routes/
│   │   │   │   ├── events.ts
│   │   │   │   ├── agents.ts
│   │   │   │   └── departments.ts
│   │   │   └── ws/
│   │   │       └── hub.ts   # WebSocket ブロードキャスト
│   │   └── package.json
│   └── web/                 # React + PixiJS + Vite
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   └── office-view/
│       │   │       ├── OfficeView.tsx
│       │   │       ├── buildScene.ts
│       │   │       ├── drawing-core.ts
│       │   │       ├── model.ts
│       │   │       └── themes.ts
│       │   ├── hooks/
│       │   │   └── useWebSocket.ts
│       │   └── types.ts
│       └── package.json
├── examples/
│   └── claude-code-hooks.jsonc  # Claude Code 用 Hook 設定サンプル
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```
