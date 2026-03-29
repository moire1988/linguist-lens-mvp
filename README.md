# LinguistLens MVP

🌐 **Production URL:** [https://linguistlens.app/](https://linguistlens.app/)

Next.js 14（App Router）+ Clerk + Supabase の英語学習 SaaS。  
**この README は私用メモ**（よく使うコマンドの置き場）です。

## 前提

```bash
cd /path/to/linguist-lens-mvp
npm install
```

`.env.local` に Clerk / Supabase など必要な変数を設定する。

---

## よく使うコマンド

| 用途 | コマンド |
|------|----------|
| 開発サーバー | `npm run dev` |
| `.next` を消してから開発（キャッシュ不調時） | `rm -rf .next && npm run dev` |
| 本番ビルド | `npm run build` |
| 本番ビルド後のローカル起動 | `npm run start` |
| Lint | `npm run lint` |
| X 投稿スクリプト（Groq 等・要環境変数） | `npm run post-to-x` |
| X 投稿（Phase 1: URL なし純粋教育コンテンツ） | `POST_TO_X_PHASE1=1 npm run post-to-x` |
| 返信アシスト（Groq が3パターン生成） | `npm run reply-assist "ツイート文面"` |

### ワンライナー（コピペ用）

```bash
# 開発
npm run dev
```

```bash
# Next の出力を捨ててから開発し直す
rm -rf .next && npm run dev
```

```bash
# 本番相当の動作確認
npm run build && npm start
```

```bash
# 日次ポスト用スクリプト（リポジトリルートで）
npm run post-to-x
```

`post-to-x` 用のキー名などは `scripts/post-to-x.ts` 先頭コメントと `.env` / GitHub Secrets を参照。

---

## X（Twitter）グロース運用

### Phase 1（最初の30日）— アカウント信頼獲得期

**目標:** フォロワー 100 / X アルゴリズムの Bot 判定回避 / ターゲットクラスタでの認知獲得

#### 基本戦略

| 項目 | 方針 |
|------|------|
| 投稿 vs 返信 | **70/30 ルール**（返信 70%・自己投稿 30%） |
| URL | **完全禁止**（Bot 判定・凍結リスク回避） |
| ターゲット | 英語学習系・個人開発系アカウント 15 件を固定リスト化 |
| 自動化 | 投稿のみ自動（GitHub Actions）。返信は **完全手動** |

#### 自動投稿（Phase 1 モード）

```bash
# .env.local に追記するか、実行時に付与
POST_TO_X_PHASE1=1 npm run post-to-x
```

- URL（CTA リンク）を投稿・リプライから完全除去
- Groq が生成した URL を最終サニタイズで二重除去（保険）
- Phase 2 移行時は `POST_TO_X_PHASE1` を削除または `0` にするだけ

GitHub Actions（`.github/workflows/` の cron ジョブ）を使う場合は
Secrets に `POST_TO_X_PHASE1=1` を追加する。

#### 半自動・返信アシスト

返信は **絶対に自動投稿しない**（凍結リスク）。代わりに Groq が原稿3パターンを即時生成 → 手動コピペで投稿する。

```bash
# ターミナルにツイート文面を貼って実行
npm run reply-assist "ここにリプライ先のツイート文面を貼る"

# パイプも使える
echo "ツイート文面" | npm run reply-assist
```

出力例:

```
▶ パターン1【専門知見で深掘り】
（3〜4文のリプライ原稿）
【使いどき】相手が中上級者で学習論に興味があるとき

▶ パターン2【共感 + 意外な補足Tips】
...

▶ パターン3【問い返し・会話を続ける】
...
```

#### 毎日15分の運用ルーティン（7:00〜7:15 推奨）

```
[7:00〜7:05] ターゲット確認・いいね
  □ リスト15アカウントを流し見
  □ いいね 5〜10件（返信は2〜3件に絞る）

[7:05〜7:12] reply-assist で返信投稿
  □ npm run reply-assist "ツイート文面" を2〜3件実行
  □ 3パターンから最適なものを選び、軽く編集してXに手動投稿

[7:12〜7:15] 自動投稿の確認
  □ GitHub Actions で自動投稿されたツイートを確認
  □ リプライが来ていたら必ず返す（3文以内でOK）
```

週1回（日曜）: フォロワー数・エンゲージメントを記録し、ターゲットリストを見直す。

#### Phase 1 卒業条件 → Phase 2 移行

| KPI | 目標 |
|-----|------|
| フォロワー数 | **100 達成** |
| 返信実施数 | 2〜3件/日 × 30日 = 60〜90件 |
| 来たリプライへの返信率 | **100%**（全員返す） |

Phase 2 移行: `.env.local` から `POST_TO_X_PHASE1=1` を削除するだけ。
以降は URL（CTA リンク）付き投稿が解禁される。

---

## 新規文法特集ページの作成手順（Claude Code × Cursor）

`/library/grammar/[slug]` 向けの SEO 記事を量産するときのメモ。  
Claude Code で企画〜指示書までまとめ、Cursor で実装する想定。

### 1. Claude Code（企画・データ・tasks 生成）

ターミナルで Claude Code を起動し、次のような `/plan` プロンプトで構成・コンテンツデータ・実装用 Markdown（`tasks/*.md`）まで一気に出させる。

```text
/plan 次のSEO集客用コンテンツとして「[テーマ（例：makeとdoの違い）]のコアイメージ特集ページ」を作成します。
以下のステップで計画を立て、順に実行してください：
1. @cgo-growth-hacker が狙うべきSEOキーワードと構成案を策定
2. @content-creator がB1-C1向けに、コアイメージとミニクイズを含んだ良質なコンテンツデータ（JSON/TS）を作成
3. @product-director が、既存の /library/grammar/[slug] に追加するための実装要件（Cursor向け指示書：tasks/[テーマ名]-implementation.md）を作成
```

- エージェント名（`@...`）はリポジトリ内の `.claude/agents/` やプロジェクトルールに合わせて読み替えてよい。
- 出力された `tasks/[テーマ名]-implementation.md` が、次の Cursor 側の「仕様書」になる。

### 2. Cursor（実装）

1. 生成された `tasks/*.md` を Cursor で開き、指示どおり `data/grammar-lessons.ts` にレッスンを追加（型は既存の `GrammarLesson` に合わせる）。
2. 必要なら `lib/routes-config.ts` やメタデータ周り（`lib/grammar-lesson-structured-data.ts` など）への影響を確認。
3. `npm run build` または該当ページをブラウザで確認してからコミット。

---

## 補足

- `scripts/posted_history.json` は `.gitignore` 対象（ローカル・CI で生成）。
- 仕様の参照先: `docs/specifications.md`、ルート: `lib/routes-config.ts`。
