# LinguistLens MVP

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

## 補足

- `scripts/posted_history.json` は `.gitignore` 対象（ローカル・CI で生成）。
- 仕様の参照先: `docs/specifications.md`、ルート: `lib/routes-config.ts`。
