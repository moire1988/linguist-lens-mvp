# フリーミアム戦略 & 導線改善 実装要件定義書

> **作成者**：CGO（戦略分析）→ product-director（実装仕様）
> **担当AIへの指示**：本ドキュメントを先頭から順に読み、すべてのステップを実施してください。
> **関連ファイル**：`app/library/page.tsx`、`components/nav-menu.tsx`、`app/page.tsx`、`components/phrase-of-the-day.tsx`

---

## Part 1：CGO 戦略分析（実装前に必ず読むこと）

### 1-1. 現状のペイウォール問題

現在 `/library` は「ページ全体にブラー＋オーバーレイ」という**ハードペイウォール**を採用している。

```
ユーザーが /library にアクセス
→ 即座に全コンテンツがぼかされる
→ 「価値ゼロの状態」でアップグレードを迫られる
→ 離脱率 ≒ 100%
```

これは SaaS の教科書的NG パターン。**価値を体験させる前に課金を要求している。**

### 1-2. SaaS ベストプラクティスから導く最適戦略

海外の言語学習 SaaS の成功パターンを整理する：

| サービス | 無料で得られるもの | 有料で得られるもの | 転換トリガー |
|---|---|---|---|
| **Grammarly** | 誤字脱字チェック | 文体提案・高度な指摘 | "こんな提案もあります"のロック表示 |
| **Speechling** | 月10文の発音添削 | 無制限フィードバック | 上限到達 |
| **LingQ** | 20リンガの閲覧 | 無制限 + AI機能 | 保存上限に達する |
| **Duolingo** | 全コース | Streak Freeze・広告なし | ストリーク切れ焦り |

**共通原則：「Aha Moment（価値体験）を無料で提供し、深掘りを有料にする」**

### 1-3. LinguistLens /library への最適フリーミアム設計

**推奨モデル：アコーディオンゲート型フリーミアム**

```
【無料】150件全カードが閲覧・検索・フィルタ可能
  ├── expression（表現）
  ├── meaning_ja（意味）
  ├── coreImage（コアイメージ ← ここが LinguistLens の最大の差別化）
  └── goodExample / badExample（例文）

【プレミアム】詳細アコーディオン「詳しいニュアンスを見る」
  ├── nuance（ニュアンス詳説）
  ├── context（使用シーン）
  └── why_hard_for_japanese（なぜ日本人に難しいか）
  + 「マイページに保存」ボタン（現状と同じ）
```

**なぜこの分割か：**
- `coreImage`（コアイメージ）は一覧でも見えるため「こんな視点か、面白い！」という Aha Moment が発生する
- アコーディオンを開こうとして「これはプレミアム」と分かる → **欲求が高まった瞬間の課金提案** = 最高のタイミング
- 150件全検索可能 = SEO 的にも「英語表現 ○○ コアイメージ」でインデックスされる可能性
- grammar 特集（完全無料）との役割分担：「文法トピック別に深く学ぶ」→「個別表現を自分のペースで探す（プレミアム）」

### 1-4. 文法特集への導線が「フッターのみ」である問題

現状：フッター（`lib/routes-config.ts` の `APP_ROUTES`）にしか存在しない。

**これは SEO 集客した神コンテンツの死**。フッターは誰も読まない。

ユーザーの動線を以下に再設計する：

```
トップページ（/）
├── [1] NavMenu に「文法特集」リンク追加（常時表示、Crown なし = 無料の主張）
├── [2] 今日のフレーズウィジェット フッターに「文法コアイメージ特集 →」追加
└── [3] PhraseOfTheDay の下に「文法特集バナー」セクション追加

/library（ライブラリページ）
├── [4] アコーディオンのロック状態 UI に「文法特集で無料学習 →」リンク追加
└── [5] 右上（プレミアムバナー）に「まずは無料の文法特集を読む →」リンク追加

/library/grammar/[slug]（文法特集）
└── [6] CTA ブロック上に「ライブラリで150表現を探す →」（プレミアム誘導）追加
```

---

## Part 2：product-director 実装仕様

### 変更 1：`app/library/page.tsx` — ハードペイウォール → アコーディオンゲート型フリーミアム

#### 1-A. 全体ブラーの削除

現在 `LibraryPage` の JSX に以下のクラスがある：

```tsx
<div
  className={cn(
    showPremiumTeaser && "blur-md pointer-events-none select-none"
  )}
>
```

これを**削除**し、代わりに非プレミアムユーザー向けの**インフォバナー**を追加する。

**変更後のイメージ：**
```tsx
{/* ブラー div を削除 — 非プレミアムでも全カード閲覧可能 */}
<div>
  {/* 非プレミアム向けインフォバナー（ページ上部に1回だけ表示） */}
  {showPremiumTeaser && (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
      <span className="text-lg">✨</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-0.5">
          ニュアンス詳細はプレミアム会員限定
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          一覧と例文は無料で閲覧できます。「詳しいニュアンスを見る」はプレミアム会員のみ。
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 transition-colors"
          >
            プレミアムになる →
          </Link>
          <span className="text-amber-400">|</span>
          <Link
            href="/library/grammar"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 transition-colors"
          >
            まずは無料の文法特集を読む →
          </Link>
        </div>
      </div>
    </div>
  )}
  {/* 以下は既存のカード一覧 */}
  ...
</div>
```

#### 1-B. 既存のプレミアムオーバーレイ (`createPortal` ブロック) の削除

`app/library/page.tsx` の末尾にある `createPortal(...)` ブロック（モーダルオーバーレイ全体）を**削除**する。

```tsx
// ↓ このブロック全体を削除
{overlayMounted &&
  showPremiumTeaser &&
  createPortal(
    <>
      <div className="fixed inset-0 z-[5000] ..." />
      <div className="fixed inset-0 z-[5001] ...">
        {/* WaitlistCta など */}
      </div>
    </>,
    document.body
  )}
```

合わせて使われなくなる state と effect も削除：
- `const [overlayMounted, setOverlayMounted] = useState(false);`
- `useEffect(() => { setOverlayMounted(true); }, []);`
- `useEffect(() => { if (!showPremiumTeaser) return; document.body.style.overflow = ... }, [showPremiumTeaser]);`

#### 1-C. `ExpressionCard` にアコーディオンゲートを実装

**props に `isPremium` を追加：**

```tsx
function ExpressionCard({
  entry,
  isSavedInitially,
  isSignedIn,
  isPremium,        // ← 追加
  onSaved,
}: {
  entry: LibraryEntry;
  isSavedInitially: boolean;
  isSignedIn: boolean;
  isPremium: boolean; // ← 追加
  onSaved: (expressionLower: string) => void;
}) {
```

**アコーディオンボタンのロジック変更：**

現在：
```tsx
<button
  onClick={() => setOpen((v) => !v)}
  className="flex items-center justify-between px-5 py-3 border-t border-slate-100 ..."
>
  <span>{open ? "閉じる" : "詳しいニュアンスを見る"}</span>
  ...
</button>
```

変更後（非プレミアムはロック表示）：
```tsx
<button
  onClick={() => {
    if (!isPremium) {
      // プレミアム未登録: /upgrade へ誘導するトースト
      toast.info("詳細ニュアンスはプレミアム会員限定です", {
        description: "アップグレードで全表現の深い解説が読み放題になります",
        action: {
          label: "アップグレード",
          onClick: () => window.location.href = "/upgrade",
        },
        duration: 5000,
      });
      return;
    }
    setOpen((v) => {
      const opening = !v;
      if (opening) {
        trackAccordionOpened({
          expression: entry.expression,
          cefr_level: entry.level,
          source: "library",
        });
      }
      return opening;
    });
  }}
  className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors rounded-b-none"
>
  <span className="flex items-center gap-1.5">
    {!isPremium && (
      // ロックアイコン（lucide の Lock）
      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
    )}
    {open ? "閉じる" : "詳しいニュアンスを見る"}
  </span>
  {open ? (
    <ChevronUp className="w-4 h-4" />
  ) : (
    <ChevronDown className="w-4 h-4" />
  )}
</button>
```

インポートに `Lock` を追加：
```tsx
import {
  ChevronDown, ChevronUp, BookmarkPlus, Check, AlertTriangle,
  X, Lightbulb, Zap, Shuffle, Search, Volume2, Crown, Loader2,
  Lock,  // ← 追加
} from "lucide-react";
```

また `trackAccordionOpened` のインポートを追加：
```tsx
import { trackAccordionOpened } from "@/lib/analytics";
```

#### 1-D. `VirtualizedExpressionRows` と `ExpressionCard` への `isPremium` 受け渡し

`VirtualizedExpressionRows` の props に追加：

```tsx
function VirtualizedExpressionRows({
  entries,
  columns,
  savedExpressions,
  isSignedIn,
  isPremium,     // ← 追加
  onSaved,
}: {
  ...
  isPremium: boolean; // ← 追加
  ...
}) {
```

`ExpressionCard` の呼び出し箇所にも渡す：
```tsx
<ExpressionCard
  key={entry.id}
  entry={entry}
  isSavedInitially={savedExpressions.has(entry.expression.toLowerCase())}
  isSignedIn={isSignedIn}
  isPremium={isPremium}  // ← 追加
  onSaved={onSaved}
/>
```

`LibraryPage` の `VirtualizedExpressionRows` 呼び出し箇所にも渡す：
```tsx
<VirtualizedExpressionRows
  entries={displayList}
  columns={gridColumns}
  savedExpressions={savedExpressions}
  isSignedIn={Boolean(isSignedIn)}
  isPremium={isPremium}  // ← 追加
  onSaved={handleVocabSaved}
/>
```

---

### 変更 2：`components/nav-menu.tsx` — 文法特集リンクを追加

`PRIMARY_LINKS` 配列に文法特集リンクを追加する（**「厳選表現ライブラリ」の直前**に挿入）。

**変更前：**
```typescript
const PRIMARY_LINKS: NavLinkDef[] = [
  {
    icon: BookMarked,
    title: "マイページ",
    description: "解析した表現を復習",
    href: "/mypage",
  },
  {
    icon: BookOpen,
    title: "学習記事一覧",
    description: "学習のコツと文化背景",
    href: "/articles",
  },
  {
    icon: Library,
    title: "厳選表現ライブラリ",
    description: "生きた表現を検索",
    href: "/library",
    premiumCrown: true,
  },
];
```

**変更後：**
```typescript
import {
  Menu, X, BookMarked, BookOpen, Lightbulb, Settings, Library, Crown,
  ChevronLeft, GraduationCap,  // ← GraduationCap を追加
} from "lucide-react";

const PRIMARY_LINKS: NavLinkDef[] = [
  {
    icon: BookMarked,
    title: "マイページ",
    description: "解析した表現を復習",
    href: "/mypage",
  },
  {
    icon: BookOpen,
    title: "学習記事一覧",
    description: "学習のコツと文化背景",
    href: "/articles",
  },
  {
    icon: GraduationCap,          // ← 追加
    title: "文法コアイメージ特集",  // ← 追加
    description: "ingとto・前置詞の感覚を理解", // ← 追加
    href: "/library/grammar",      // ← 追加
    // premiumCrown なし = 無料コンテンツであることを明示
  },
  {
    icon: Library,
    title: "厳選表現ライブラリ",
    description: "生きた表現を検索",
    href: "/library",
    premiumCrown: true,
  },
];
```

---

### 変更 3：`components/phrase-of-the-day.tsx` — フッターに文法特集リンク追加

ウィジェット末尾のフッター部分を変更する。

**変更前：**
```tsx
<div className="border-t border-indigo-100/60 px-5 py-3 flex items-center justify-between bg-white/30">
  <p className="text-[10px] text-slate-400">明日は新しいフレーズをお届けします</p>
  <Link
    href="/library"
    className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
  >
    150件を全部見る →
  </Link>
</div>
```

**変更後：**
```tsx
<div className="border-t border-indigo-100/60 px-5 py-3 bg-white/30">
  <div className="flex items-center justify-between">
    <p className="text-[10px] text-slate-400">明日は新しいフレーズをお届けします</p>
    <Link
      href="/library"
      className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
    >
      150件を全部見る →
    </Link>
  </div>
  {/* 文法特集への誘導（追加） */}
  <div className="mt-2 pt-2 border-t border-indigo-50 flex items-center gap-1.5">
    <span className="text-[10px] text-slate-400">文法の感覚も身につけたい？</span>
    <Link
      href="/library/grammar"
      className="text-[10px] font-semibold text-violet-500 hover:text-violet-700 transition-colors"
    >
      文法コアイメージ特集（無料）→
    </Link>
  </div>
</div>
```

---

### 変更 4：`app/page.tsx` — 文法特集バナーセクションの追加

`PhraseOfTheDay` の直後、`RecommendedCarousel` の直前に、文法特集への誘導バナーを追加する。

**挿入箇所（現在 line 1179〜1186 付近）：**

```tsx
{/* ── 今日のフレーズ ── */}
<div className="mt-10 mb-2 max-w-2xl mx-auto">
  <PhraseOfTheDay />
</div>

{/* ── 文法コアイメージ特集バナー（追加）── */}
<GrammarFeatureBanner />    {/* ← 追加 */}

{/* ── Recommended Carousel ── */}
{!hasContent && <RecommendedCarousel />}
```

`GrammarFeatureBanner` はこのファイル内にインラインで定義する（小さいため新規ファイル不要）：

```tsx
// app/page.tsx の先頭付近（インポートの後）に追加
import Link from "next/link";  // 既存
// ↓ アイコン追加（既存の lucide インポートに追記）
// Sparkles は既存インポートにある想定。なければ追加。

// ─── GrammarFeatureBanner ──────────────────────────────────────────────────
function GrammarFeatureBanner() {
  return (
    <div className="mt-4 mb-6 max-w-2xl mx-auto px-0">
      <Link
        href="/library/grammar"
        className="group flex items-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 hover:border-violet-200 hover:shadow-sm transition-all"
      >
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
          <span className="text-xl" aria-hidden>📐</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold text-violet-700 tracking-wide">
              文法コアイメージ特集
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              無料
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-snug">
            「ing と to」「前置詞」など、日本人が感覚的に使えない文法を<br className="hidden sm:block" />
            コアイメージで徹底解説
          </p>
        </div>
        <span className="text-slate-400 group-hover:text-violet-500 transition-colors text-sm font-medium">
          →
        </span>
      </Link>
    </div>
  );
}
```

---

### 変更 5：`app/library/page.tsx` — プレミアムバナーに文法特集リンク追加（変更 1-A で実装済み）

変更 1-A のインフォバナー内に既に「まずは無料の文法特集を読む →」を含めているため、追加変更は不要。

---

## Part 3：完了チェックリスト

### ライブラリ フリーミアム化
- [ ] `app/library/page.tsx` — `blur-md pointer-events-none select-none` クラスを削除済み
- [ ] `app/library/page.tsx` — `createPortal` オーバーレイブロックを削除済み
- [ ] `app/library/page.tsx` — 関連 state/effect（`overlayMounted`, `body.overflow`）を削除済み
- [ ] `app/library/page.tsx` — 非プレミアム向けインフォバナー（amber 系）を追加済み
- [ ] `app/library/page.tsx` — `ExpressionCard` に `isPremium` prop 追加済み
- [ ] `app/library/page.tsx` — `VirtualizedExpressionRows` に `isPremium` prop 追加済み
- [ ] `app/library/page.tsx` — アコーディオンボタンに Lock アイコン + `isPremium` ゲート実装済み
- [ ] `app/library/page.tsx` — `lucide-react` から `Lock` を import 済み
- [ ] `app/library/page.tsx` — `trackAccordionOpened` を import 済み

### ナビゲーション改善
- [ ] `components/nav-menu.tsx` — `GraduationCap` を import 済み
- [ ] `components/nav-menu.tsx` — `PRIMARY_LINKS` に「文法コアイメージ特集」追加済み（Crown なし）

### ホームページ導線
- [ ] `components/phrase-of-the-day.tsx` — フッターに「文法コアイメージ特集（無料）→」リンク追加済み
- [ ] `app/page.tsx` — `GrammarFeatureBanner` コンポーネント定義済み
- [ ] `app/page.tsx` — `PhraseOfTheDay` 直後に `<GrammarFeatureBanner />` 挿入済み

### 品質確認
- [ ] `npm run build` でビルドエラーなし
- [ ] `/library` でカード一覧が表示され、ブラーがかかっていないこと
- [ ] 非プレミアムでアコーディオンボタンをクリック → toast が表示されること
- [ ] プレミアム（`LIBRARY_PREMIUM_TEST_OVERRIDE = "premium"` で確認）ではアコーディオンが開くこと
- [ ] NavMenu 開いたとき「文法コアイメージ特集」リンクが表示されること（Crown なし）
- [ ] `PhraseOfTheDay` ウィジェット下部に「文法コアイメージ特集（無料）→」が表示されること
- [ ] ホームページに文法特集バナーが表示されること

---

## Part 4：グロース会議で使う仮説検証フレーム（実装後）

| 計測指標 | 計測方法 | 成功の閾値 | 失敗時のアクション |
|---|---|---|---|
| `/library` の直帰率 | GA4 → エンゲージメント → ページ | 旧比 -20% 以上改善 | バナー文言変更 |
| アコーディオン試みクリック数（非プレミアム） | GA4 `accordion_opened`（ゲートで止まったもの） | 週10クリック以上 | ゲートのタイミング再検討 |
| `/library` → `/upgrade` の遷移率 | GA4 パス探索 | 5% 以上 | toast の文言・CTA 改善 |
| NavMenu から `/library/grammar` クリック | GA4 `click` イベント | 週20クリック以上 | アイコン・ラベル変更 |
| `GrammarFeatureBanner` クリック率 | GA4 `click` | インプレッションの 10% 以上 | バナーデザイン・コピー変更 |

> **次フェーズ候補**：アコーディオンゲートのクリック数が十分集まったら、「N件だけ無料で開ける（月5件まで）」へ移行する段階的フリーミアムも検討。
