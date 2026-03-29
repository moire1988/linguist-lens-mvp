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
