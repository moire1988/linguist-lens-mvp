# 要件定義：アナリティクス基盤の導入（Vercel Analytics + カスタムイベント）

> **目的**：来週のグロース会議に向けて、「ユーザーが何に興味を持ちどこで離脱するか」を計測する最小限のデータ収集基盤を構築する。
> **担当AIへの指示**：このファイルを読んで、すべてのステップを順番に実施してください。

---

## 背景・現状

- **フレームワーク**：Next.js 14.2.35（App Router、TypeScript）
- **ホスティング**：Vercel（想定）
- **現状**：アナリティクスは一切未導入
- **計測したい行動**：
  1. ユーザーが「マイページに保存」ボタンを押したとき
  2. ユーザーが詳細アコーディオンを開いたとき

---

## Step 1：Vercel Analytics のインストール

### 1-1. パッケージ追加

```bash
npm install @vercel/analytics
```

### 1-2. `app/layout.tsx` に `<Analytics />` コンポーネントを追加

`app/layout.tsx` を開き、`<body>` 直下（または `</body>` 直前）に以下を挿入してください。

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

// <body> タグ内の末尾に追加
<Analytics />
```

**注意**：`<Analytics />` は Server Component 対応済みなので `"use client"` は不要です。

---

## Step 2：カスタムイベント計測ユーティリティの作成

### 2-1. `lib/analytics.ts` を新規作成

以下の内容で `lib/analytics.ts` を作成してください。

```typescript
// lib/analytics.ts
// Vercel Analytics カスタムイベントの型安全ラッパー
import { track } from '@vercel/analytics';

/** フレーズ保存イベントのペイロード */
export interface PhraseSavedPayload {
  expression: string;
  type: string;          // phrasal_verb | idiom | collocation | grammar_pattern
  cefr_level: string;   // A1〜C2
  source: 'analysis' | 'library';  // 解析結果カードか、ライブラリページか
}

/** アコーディオン開封イベントのペイロード */
export interface AccordionOpenedPayload {
  expression: string;
  cefr_level: string;
  source: 'analysis' | 'library';
}

/**
 * ユーザーがフレーズを保存したときに呼び出す。
 * Supabase への保存が成功した後に呼ぶこと（重複やエラー時は呼ばない）。
 */
export function trackPhraseSaved(payload: PhraseSavedPayload) {
  track('phrase_saved', payload);
}

/**
 * ユーザーが詳細アコーディオンを「開いた」ときに呼び出す。
 * 閉じるときは呼ばない（開封のみを計測）。
 */
export function trackAccordionOpened(payload: AccordionOpenedPayload) {
  track('accordion_opened', payload);
}
```

---

## Step 3：`components/phrase-card.tsx` への計測追加

**対象ファイル**：`components/phrase-card.tsx`

### 3-1. インポートの追加

ファイル先頭のインポート群に以下を追加してください。

```typescript
import { trackPhraseSaved, trackAccordionOpened } from '@/lib/analytics';
```

### 3-2. `handleSave` 関数へのイベント追加

現在の `handleSave`（`onSave` を呼び出した後）に、保存成功時のみイベントを送出する処理を追加してください。

**変更前（該当箇所、概要）：**
```typescript
const handleSave = useCallback(async () => {
  if (saved || isSavingThis) return;
  if (!isSignedIn) {
    openLoginPrompt("save");
    return;
  }
  await Promise.resolve(onSave(phrase));
}, [saved, isSavingThis, isSignedIn, phrase, onSave]);
```

**変更後：**
```typescript
const handleSave = useCallback(async () => {
  if (saved || isSavingThis) return;
  if (!isSignedIn) {
    openLoginPrompt("save");
    return;
  }
  await Promise.resolve(onSave(phrase));
  // 保存成功後にイベント送出（onSave がエラーを throw する場合は送出されない）
  trackPhraseSaved({
    expression: phrase.expression,
    type: phrase.type,
    cefr_level: phrase.cefr_level,
    source: 'analysis',
  });
}, [saved, isSavingThis, isSignedIn, phrase, onSave]);
```

### 3-3. アコーディオンボタンへのイベント追加

「学習のポイント」アコーディオンの `onClick` ハンドラを以下のように更新してください。

**変更前（概要）：**
```tsx
<button
  onClick={() => setShowDetail(!showDetail)}
  ...
>
```

**変更後：**
```tsx
<button
  onClick={() => {
    const opening = !showDetail;
    setShowDetail(opening);
    if (opening) {
      trackAccordionOpened({
        expression: phrase.expression,
        cefr_level: phrase.cefr_level,
        source: 'analysis',
      });
    }
  }}
  ...
>
```

---

## Step 4：`app/library/page.tsx` の `ExpressionCard` への計測追加

**対象ファイル**：`app/library/page.tsx`

### 4-1. インポートの追加

ファイル先頭のインポート群に以下を追加してください。

```typescript
import { trackPhraseSaved, trackAccordionOpened } from '@/lib/analytics';
```

### 4-2. `handleSave` 関数へのイベント追加

`ExpressionCard` 内の `handleSave` で保存成功時（`result.success` が `true` のケース、および Supabase 保存成功後）にイベントを追加してください。

**ログイン済み（Supabase 保存）のケース：**

```typescript
.then((result) => {
  if (result.success) {
    setSaved(true);
    onSaved(exprKey);
    setFlash("saved");
    toast.success("保存しました");
    setTimeout(() => setFlash(null), 2000);
    // ↓ 追加
    trackPhraseSaved({
      expression: entry.expression,
      type: entry.type,
      cefr_level: entry.level,
      source: 'library',
    });
  } else if (result.reason === "duplicate") {
    // duplicate の場合はイベント送出しない（初回保存のみ計測）
    ...
  }
})
```

**未ログイン（localStorage 保存）のケース：**

```typescript
const result = savePhrase({ ... });
if (result.success) {
  setSaved(true);
  onSaved(exprKey);
  setFlash("saved");
  setTimeout(() => setFlash(null), 2000);
  // ↓ 追加
  trackPhraseSaved({
    expression: entry.expression,
    type: entry.type,
    cefr_level: entry.level,
    source: 'library',
  });
}
```

### 4-3. アコーディオンボタンへのイベント追加

「詳しいニュアンスを見る」ボタンの `onClick` を以下のように更新してください。

**変更前（概要）：**
```tsx
<button
  onClick={() => setOpen((v) => !v)}
  ...
>
```

**変更後：**
```tsx
<button
  onClick={() => {
    setOpen((v) => {
      const opening = !v;
      if (opening) {
        trackAccordionOpened({
          expression: entry.expression,
          cefr_level: entry.level,
          source: 'library',
        });
      }
      return opening;
    });
  }}
  ...
>
```

---

## Step 5：Vercel ダッシュボードでの確認手順（実装後）

実装が完了したら、以下の手順で動作確認してください。

1. `npm run build && npm start` でローカル本番ビルドを起動
2. ブラウザで http://localhost:3000 を開く
3. フレーズカードの「マイページに保存」を押す
4. アコーディオンを開く
5. Vercel ダッシュボード → Analytics → Events で `phrase_saved`・`accordion_opened` が表示されることを確認

> **開発環境（`npm run dev`）では `@vercel/analytics` のイベントはコンソールログに出力されますが Vercel には送信されません。**
> 本番デプロイ後に Vercel Analytics が有効になります。

---

## 計測イベント一覧（グロース会議用メモ）

| イベント名 | 発火タイミング | 主要プロパティ | グロース上の意義 |
|---|---|---|---|
| `phrase_saved` | 「マイページに保存」成功時 | `expression`, `type`, `cefr_level`, `source` | どのレベル・種別のフレーズが人気か把握 → ライブラリ拡充の優先順位判断 |
| `accordion_opened` | 詳細アコーディオンを開いたとき | `expression`, `cefr_level`, `source` | ユーザーがどのフレーズに深く興味を持つか把握 → 「保存せず読み逃げ」する表現の発見 |

---

## 完了チェックリスト

- [ ] `npm install @vercel/analytics` 実行済み
- [ ] `app/layout.tsx` に `<Analytics />` 追加済み
- [ ] `lib/analytics.ts` 新規作成済み
- [ ] `components/phrase-card.tsx` — `handleSave` にイベント追加済み
- [ ] `components/phrase-card.tsx` — アコーディオン onclick にイベント追加済み
- [ ] `app/library/page.tsx` — `handleSave`（Supabase 保存成功時）にイベント追加済み
- [ ] `app/library/page.tsx` — `handleSave`（localStorage 保存成功時）にイベント追加済み
- [ ] `app/library/page.tsx` — アコーディオン onclick にイベント追加済み
- [ ] TypeScript ビルドエラーなし（`npm run build` 通過）
- [ ] Vercel にデプロイ後、Analytics ダッシュボードでイベントを確認
