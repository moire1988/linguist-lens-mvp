# UX改善指示書：新規ユーザーオンボーディング CTR ボトルネック 3件

> レビュアー: @product-director + @cgo-growth-hacker（2026-03-29）
> 目的: 新規ユーザーのコアアクション到達率（URL解析 / Library探索）の改善
> 作業ブランチ: develop

---

## ボトルネック 1（高）: オンボーディングStep3 — ボタン優先順位逆転

**ファイル:** `components/onboarding-modal.tsx`
**行番号:** L458-485（Step 3 の JSX ブロック）

### 問題
Google ログインボタンが白地で目立たない。グラデーション「はじめる」ボタンの方が
視覚的に強いため、ほとんどのユーザーがログインをスキップして開始する。

### Before（現状）
```tsx
{/* ① Google ログイン: 白・サブ感 */}
<button
  className="flex w-full items-center justify-center gap-2.5 rounded-xl border
    border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm
    transition-colors hover:border-slate-300 hover:bg-slate-50"
>
  <GoogleIcon />
  Googleでログイン / 連携
</button>

{/* ② "はじめる": グラデ・目立つ */}
<button
  className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-white
    transition-all border-indigo-400/70 bg-gradient-to-r from-violet-500 to-blue-500
    hover:from-violet-600 hover:to-blue-600 hover:shadow-[0_8px_22px_rgba(99,102,241,0.35)]"
>
  ✨ あなただけのLinguistLensをはじめる
</button>

<p className="text-center text-[10px] text-slate-400">
  ※後から右上の設定(⚙️)でいつでも変更できます
</p>
```

### After（改善案）

```tsx
{/* ① Google ログイン: グラデ・プライマリ */}
<button
  type="button"
  onClick={() =>
    openSignIn({
      redirectUrl: typeof window !== "undefined" ? window.location.href : "/",
    })
  }
  className="flex w-full items-center justify-center gap-2.5 rounded-xl
    border border-indigo-400/70 bg-gradient-to-r from-violet-500 to-indigo-600
    py-3 text-sm font-bold text-white shadow-md
    hover:from-violet-600 hover:to-indigo-700
    hover:shadow-[0_8px_22px_rgba(99,102,241,0.35)] transition-all"
>
  <GoogleIcon />
  Googleでログイン（無料・30秒）
</button>

{/* ② ゲスト開始: アウトライン・セカンダリ */}
<button
  type="button"
  onClick={() => onStart({ level, accent })}
  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5
    text-sm font-medium text-slate-500 transition-colors
    hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
>
  ログインせずに試してみる
</button>

{/* 注釈: 変更点 — ゲスト開始の制約を明示 */}
<p className="text-center text-[10px] text-slate-400">
  ※ログインなしでは解析履歴が端末に残りません
</p>
```

### 変更点まとめ
| 項目 | Before | After |
|------|--------|-------|
| Google ログインの色 | 白（bg-white） | グラデーション（primary） |
| ゲスト開始の色 | グラデーション（目立つ） | アウトライン（secondary） |
| Google ログインのコピー | "Googleでログイン / 連携" | "Googleでログイン（無料・30秒）" |
| ゲスト開始のコピー | "✨ あなただけのLinguistLensをはじめる" | "ログインせずに試してみる" |
| 注釈 | "後から設定で変更可" | "ログインなしでは履歴が保存されない" |

---

## ボトルネック 2（中）: URL入力フォーム — CEFR セレクターが視線を分断

**ファイル:** `app/page.tsx`
**行番号:** L965-1037（CEFR Level Selector セクション）

### 問題
URL貼り付け → 解析実行というコアフロー中間に、CEFRの6段階セレクターが挿入される。
"CEFR"という専門用語の認知コスト＋6ボタングリッドの視覚的重さが、
初回ユーザーの「とりあえず試す」行動を阻害する。

### 改善方針
**レベルセレクターを送信ボタンの「下」に移動する + デフォルト推奨を強調する**

### After（改善案）

**Step A: Input Card の JSX 内でレベルセレクターを送信ボタンの後に移動**

```tsx
{/* 1. URL input */}
{inputMode === "url" && ( ... )}

{/* 2. Text input */}
{inputMode === "text" && ( ... )}

{/* 3. Submit button ← 先に来る */}
<button
  type="button"
  onClick={handleSubmit}
  disabled={!canSubmit || analysisBusy}
  ...
>
  ...
</button>

{/* 4. CEFR Level Selector ← 送信ボタンの下に移動 */}
<details className="mt-4 group">
  <summary className="flex items-center justify-between cursor-pointer
    text-xs text-slate-500 font-medium select-none
    hover:text-slate-700 transition-colors">
    <span>
      📊 あなたのレベル: <strong className="text-indigo-600 font-mono">{selectedLevel}</strong>
      <span className="ml-1.5 text-slate-400">（変更する）</span>
    </span>
    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-open:rotate-90 transition-transform" />
  </summary>
  <div className="mt-3 pt-3 border-t border-slate-100">
    {/* 既存の CEFR グリッドをそのまま */}
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
      {CEFR_LEVELS.map((level) => { ... })}
    </div>
    {/* 推奨バッジ（B2がデフォルト選択の場合） */}
    <p className="mt-2 text-[10px] text-slate-400">
      ※ わからない場合は <span className="font-mono font-semibold text-indigo-500">B2（中上級）</span> がおすすめです
    </p>
  </div>
</details>
```

### 変更点まとめ
| 項目 | Before | After |
|------|--------|-------|
| レベルセレクターの位置 | URL入力 と 送信ボタン の間 | 送信ボタンの下 |
| デフォルト状態 | 常に展開 | `<details>` で折りたたみ |
| 表示内容（折りたたみ時） | 6ボタングリッド全表示 | "レベル: B2（変更する）" 1行 |
| 推奨ガイド | なし | "わからない場合はB2がおすすめ" |

**注意:** `selectedLevel` のデフォルト値を `"B2"` のままにする。
`details` の初期状態は `open` なしで折りたたみ。
`getSettings()` から読み込むロジック（L192-199）はそのまま維持。

---

## ボトルネック 3（高）: NavMenu の Library に Crown が残存

**ファイル:** `components/nav-menu.tsx`
**行番号:** L41-67（PRIMARY_LINKS 配列定義）

### 問題
アコーディオンゲート型フリーミアムへの移行後も Crown アイコンが残り、
Library への入口で「有料機能」の先入観を与えている。

### Before（現状）
```typescript
const PRIMARY_LINKS: NavLinkDef[] = [
  { icon: BookMarked, title: "マイページ", href: "/mypage" },
  { icon: BookOpen,   title: "学習記事一覧", href: "/articles" },
  { icon: GraduationCap, title: "文法コアイメージ特集", href: "/library/grammar" },
  {
    icon: Library,
    title: "厳選表現ライブラリ",
    description: "生きた表現を検索",
    href: "/library",
    premiumCrown: true,   // ← 削除する
  },
];
```

### After（改善案）

```typescript
const PRIMARY_LINKS: NavLinkDef[] = [
  { icon: BookMarked, title: "マイページ", href: "/mypage" },
  { icon: BookOpen,   title: "学習記事一覧", href: "/articles" },
  { icon: GraduationCap, title: "文法コアイメージ特集", href: "/library/grammar" },
  {
    icon: Library,
    title: "厳選表現ライブラリ",
    description: "150表現を無料で検索・閲覧",  // ← "無料で" を追加
    href: "/library",
    // premiumCrown: true,  ← 削除
  },
];
```

### 追加対応: Library インデックスページのバナーコピー確認

`app/library/page.tsx` 内の非プレミアム向けバナーのコピーも確認し、
「プレミアム」「有料」という言葉が Library の入口に出ていないか確認する。
MEMORY.md の方針：
> 無料範囲：expression / meaning_ja / coreImage / 例文（全150件閲覧・検索可）

が正しくバナーに反映されているか確認し、必要であれば「まずは無料で150件を見てみる」の
方向に調整する。

### 変更点まとめ
| 項目 | Before | After |
|------|--------|-------|
| Crown アイコン | 表示（premiumCrown: true） | 非表示（削除） |
| description | "生きた表現を検索" | "150表現を無料で検索・閲覧" |
| Library への心理的ハードル | 高（有料機能の印象） | 低（無料で探索できる印象） |

---

## 優先順位と実装順序

| 優先度 | ボトルネック | 工数 | 期待効果 |
|--------|-------------|------|---------|
| P0 | #3: NavMenu Crown 削除 | 2行変更 | Library 流入率向上（即効性高） |
| P0 | #1: Onboarding Step3 ボタン入れ替え | 20行変更 | サインアップ率向上 |
| P1 | #2: CEFR セレクター下移動 + details 折りたたみ | 50行変更 | フォーム離脱率低下 |

P0 の2件は同じ PR に含められる軽量変更。P1 は別途実装推奨。

---

## 検証ポイント（実装後確認）

- [ ] オンボーディング Step 3 で Google ログインボタンがグラデーションになっているか
- [ ] ゲスト開始ボタンがアウトライン（白地・グレー文字）になっているか
- [ ] NavMenu の Library アイテムに Crown が表示されていないか
- [ ] Library の description が "無料で" を含んでいるか
- [ ] CEFR セレクターが `<details>` の中に収まり、デフォルト折りたたみになっているか
- [ ] `<details>` のサマリーに選択中レベル（例: "B2"）が表示されているか
- [ ] `npm run build` でビルドが通るか
