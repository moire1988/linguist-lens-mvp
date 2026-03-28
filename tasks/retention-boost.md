# CGO グロース分析レポート＆実装指示書

> **日付**：2026-03-28（初日データ分析）
> **担当AIへの指示**：「## Step 実装指示」セクションを順番に実施してください。

---

## 1. 「1人あたり4イベント」のUX現状評価

### 数字の解剖

GA4 は以下の**自動イベント**を各ユーザーに対して発火させる：

| 自動イベント | 発火タイミング | 8人分 |
|---|---|---|
| `first_visit` | 初回訪問 | 8件 |
| `session_start` | セッション開始 | 8件 |
| `page_view` | ページ遷移のたびに | 最低8件 |
| `user_engagement` | 10秒以上滞在 | 最大8件 |

**自動イベントの合計推定：24〜32件**

総イベント数が34件ということは、**ユーザーが能動的に起こした「保存」「アコーディオン開封」などのカスタムイベントは、全8人合わせてわずか2〜10件**。

### 診断：「観光客パターン」

```
来訪 → ページを眺める → 離脱
（URLを貼って解析した形跡はあるが、何も保存していない）
```

**本来あるべき「Aha Moment」の経路：**
```
URL解析 → フレーズカード表示 → 「これ使えそう！」→ 保存 → リピート
```

4イベント/人という数字は「Aha Momentへの到達率がほぼゼロ」を意味する。
ユーザーはプロダクトを体験しているが、**自分ごと化できていない**。

### 根本原因仮説

1. **URLを探す手間**：「面白そうだけど、今貼れる動画URLがない」→離脱
2. **結果が一時的**：解析結果はページを閉じれば消える → 「また今度でいいか」
3. **リターン理由がゼロ**：「明日また来る理由」が何もない

---

## 2. 今日Cursorに実装させる1つの改善

### 施策：「今日のフレーズ」ウィジェット（Daily Phrase Widget）

**なぜこれか？**

| 候補 | 効果 | 実装コスト | 判定 |
|---|---|---|---|
| Push通知リマインダー | 高 | 高（権限取得・バックエンド必要） | ❌ 今日は無理 |
| メールリマインダー | 高 | 高（メール収集フロー必要） | ❌ 今日は無理 |
| ストリークカウンター | 中 | 中（1回目は意味なし） | △ 後回し |
| **今日のフレーズ** | **高** | **低（約1時間）** | **✅ 今日やる** |

**なぜ高効果か：**
- **URLコピーが不要**：トップページを開いただけで「今日のフレーズ」が目に入る → 即座に価値を体験
- **日替わり**：「今日は何の表現かな」という習慣ループが生まれる（Duolingo と同じ原理）
- **ライブラリ150件 = 5ヶ月分**：しばらくコンテンツ追加不要
- **全ユーザー対象**：ログイン不問でアノニマスユーザーにも機能する
- **保存ボタン付き**：カスタムイベント `phrase_saved(source: 'daily_phrase')` が増え、グロース会議に使えるデータが生まれる

---

## Step 実装指示

### 前提
- ファイル構成：Next.js 14 App Router（TypeScript）
- ライブラリデータ：`data/library.json`（150件、`LibraryEntry` 型）
- ライブラリ型定義：`lib/library.ts`（`LibraryEntry` インターフェース）
- 語彙保存ロジック：`lib/vocabulary.ts`（`savePhrase`）、`app/actions/vocabulary.ts`（`saveVocabularyAction`）
- アナリティクス：`lib/analytics.ts`（`trackPhraseSaved`）← setup-analytics.md で作成済み

---

### Step 1：日付ベースのフレーズ選択ロジック

`lib/daily-phrase.ts` を新規作成してください。

```typescript
// lib/daily-phrase.ts
import type { LibraryEntry } from '@/lib/library';
import libraryData from '@/data/library.json';

const LIBRARY = libraryData as LibraryEntry[];

/**
 * 今日の日付（UTC）を seed にして、毎日違うフレーズを返す。
 * 全ユーザーが同じ日に同じフレーズを見る（SNS共有も可能）。
 */
export function getTodaysPhrase(): LibraryEntry {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const index = daysSinceEpoch % LIBRARY.length;
  return LIBRARY[index];
}

/**
 * 今日が何日目のフレーズかを返す（"Day 42 / 150" 表示用）。
 */
export function getTodaysPhraseNumber(): number {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return (daysSinceEpoch % LIBRARY.length) + 1;
}
```

---

### Step 2：`components/phrase-of-the-day.tsx` を新規作成

以下の仕様でクライアントコンポーネントを作成してください。

**表示仕様：**
- ヘッダー：「📅 今日のフレーズ」ラベル + 「Day N / 150」テキスト（右寄せ）
- CEFRレベルバッジ + タイプバッジ
- `expression`（大きく）+ TTSボタン
- `meaning_ja`（小テキスト）
- `coreImage`（インディゴ背景の吹き出し）
- `goodExample`（例文）+ `goodExampleJa`（訳）
- 「マイページに保存」ボタン（PhraseCard と同じスタイル）
- フッター：「明日は新しいフレーズをお届けします」

**保存ロジック：**
- ログイン済み → `saveVocabularyAction` を呼ぶ
- 未ログイン → `savePhrase`（localStorage）を呼ぶ
- 保存成功時 → `trackPhraseSaved({ ..., source: 'daily_phrase' })` を呼ぶ

```tsx
// components/phrase-of-the-day.tsx
'use client';

import { useState } from 'react';
import { BookmarkPlus, Check, Loader2, Lightbulb, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getTodaysPhrase, getTodaysPhraseNumber } from '@/lib/daily-phrase';
import { savePhrase } from '@/lib/vocabulary';
import { saveVocabularyAction } from '@/app/actions/vocabulary';
import { trackPhraseSaved } from '@/lib/analytics';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const LEVEL_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  A1: { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-300'  },
  A2: { bg: 'bg-sky-50',      text: 'text-sky-700',     border: 'border-sky-200'    },
  B1: { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200'},
  B2: { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'   },
  C1: { bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200' },
  C2: { bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200'   },
};

const TYPE_LABEL: Record<string, string> = {
  phrasal_verb:    '句動詞',
  idiom:           'イディオム',
  collocation:     'コロケーション',
  grammar_pattern: '文法パターン',
};

export function PhraseOfTheDay() {
  const phrase = getTodaysPhrase();
  const dayNumber = getTodaysPhraseNumber();
  const { isSignedIn } = useAuth();
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const lvCfg = LEVEL_COLOR[phrase.level] ?? LEVEL_COLOR.B2;

  const handleSave = async () => {
    if (saved || saving) return;

    if (isSignedIn) {
      setSaving(true);
      const result = await saveVocabularyAction({
        expression:          phrase.expression,
        type:                phrase.type,
        cefr_level:          phrase.level,
        meaning_ja:          phrase.meaning_ja,
        nuance:              phrase.nuance,
        example:             phrase.goodExample,
        example_translation: phrase.goodExampleJa,
        context:             phrase.context,
        why_hard_for_japanese: phrase.why_hard_for_japanese,
        status: 'learning',
      }).finally(() => setSaving(false));

      if (result.success || result.reason === 'duplicate') {
        setSaved(true);
        toast.success(result.reason === 'duplicate' ? 'すでに保存済みです' : '保存しました');
        if (result.success) {
          trackPhraseSaved({ expression: phrase.expression, type: phrase.type, cefr_level: phrase.level, source: 'daily_phrase' });
        }
      } else {
        toast.error(result.error ?? '保存できませんでした');
      }
      return;
    }

    // 未ログイン → localStorage
    const result = savePhrase({
      expression:          phrase.expression,
      type:                phrase.type,
      cefr_level:          phrase.level,
      meaning_ja:          phrase.meaning_ja,
      nuance:              phrase.nuance,
      example:             phrase.goodExample,
      example_translation: phrase.goodExampleJa,
      context:             phrase.context,
      why_hard_for_japanese: phrase.why_hard_for_japanese,
    });
    if (result.success) {
      setSaved(true);
      trackPhraseSaved({ expression: phrase.expression, type: phrase.type, cefr_level: phrase.level, source: 'daily_phrase' });
    } else {
      toast.error('保存できませんでした（上限超過または重複）');
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-indigo-600">
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wide">今日のフレーズ</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Day {dayNumber} / 150
        </span>
      </div>

      <div className="px-5 pb-2">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded border', lvCfg.bg, lvCfg.text, lvCfg.border)}>
            {phrase.level}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-white text-slate-500 border-slate-200">
            {TYPE_LABEL[phrase.type] ?? phrase.type}
          </span>
        </div>

        {/* Expression */}
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
          {phrase.expression}
        </h2>
        <p className="text-sm text-slate-500 mb-4">{phrase.meaning_ja}</p>

        {/* Core image */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-indigo-100/60 border border-indigo-200/50 mb-4">
          <Lightbulb className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-800 font-medium leading-relaxed">
            <span className="font-bold text-indigo-500 font-mono mr-1">CORE</span>
            {phrase.coreImage}
          </p>
        </div>

        {/* Good example */}
        <div className="bg-white/70 border border-slate-100 rounded-xl p-3 mb-4">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">例文</p>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">{phrase.goodExample}</p>
          <p className="text-xs text-slate-400 mt-1">{phrase.goodExampleJa}</p>
        </div>
      </div>

      {/* Save button */}
      <div className="px-5 pb-4">
        <button
          onClick={handleSave}
          disabled={saved || saving}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all',
            saved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm'
          )}
        >
          {saving  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />保存中…</>
          : saved  ? <><Check className="h-3.5 w-3.5" />マイページに保存済み</>
          :           <><BookmarkPlus className="h-3.5 w-3.5" />マイページに保存</>}
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-indigo-100/60 px-5 py-3 flex items-center justify-between bg-white/30">
        <p className="text-[10px] text-slate-400">明日は新しいフレーズをお届けします</p>
        <Link
          href="/library"
          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          150件を全部見る →
        </Link>
      </div>
    </div>
  );
}
```

---

### Step 3：`app/page.tsx` にウィジェットを配置

`app/page.tsx` を開き、以下の2箇所を変更してください。

**3-1. インポートの追加**（既存インポートの末尾に追加）

```typescript
import { PhraseOfTheDay } from '@/components/phrase-of-the-day';
```

**3-2. ウィジェットを URL 入力フォームの直上に配置**

URLフォームまたはテキストエリアが始まるセクションの直前に、以下を挿入してください。

```tsx
{/* Daily Phrase Widget */}
<div className="mb-8">
  <PhraseOfTheDay />
</div>
```

> 具体的な挿入箇所：`CEFR_LEVELS` のセレクターや「URLを入力」フォームが現れる `<form>` タグ、または `<section>` の直前のどちらか。
> ページ上部の目立つ場所に置くことが重要。

---

### Step 4：動作確認

```bash
npm run dev
```

1. http://localhost:3000 を開き「今日のフレーズ」ウィジェットが表示されること
2. 日付を変えてリロードすると別フレーズに変わること（`Date.now()` を仮に書き換えてテスト）
3. 「マイページに保存」を押すと `phrase_saved` イベントが発火すること（ブラウザ devtools → Network でVercel Analytics エンドポイントへのリクエスト確認、またはコンソールログ）
4. `npm run build` でTypeScriptエラーなし

---

## 完了チェックリスト

- [ ] `lib/daily-phrase.ts` 新規作成済み
- [ ] `components/phrase-of-the-day.tsx` 新規作成済み
- [ ] `app/page.tsx` にインポート＋ウィジェット追加済み
- [ ] ローカルで表示確認済み（「今日のフレーズ」が見える）
- [ ] 保存ボタンが動作し `phrase_saved(source: 'daily_phrase')` が発火することを確認
- [ ] `npm run build` でビルドエラーなし
- [ ] Vercel にデプロイ済み

---

## グロース会議で使う仮説検証フレーム

実装後、以下の指標を来週の会議で確認する：

| 指標 | 計測方法 | 成功の閾値 |
|---|---|---|
| `phrase_saved` のうち `source=daily_phrase` の割合 | GA4 カスタムレポート | 全保存の20%以上 |
| デイリーアクティブユーザー（DAU）の推移 | GA4 → ユーザー → 新規/リピーター | 翌週の7日後リテンション率 |
| ウィジェット経由のライブラリ遷移（`/library` クリック） | GA4 → パス探索 | 日10クリック以上 |

> **次のネクストステップ候補**：ウィジェット保存率が高い場合 → 「昨日のフレーズを復習」機能（Spaced Repetition の芽）を追加検討。
