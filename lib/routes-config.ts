/**
 * アプリ主要ルートの Single Source of Truth。
 * フッターサイトマップ・権限説明（管理者 HoverCard）・AI/実装の参照用。
 *
 * 動的ルート（/examples/[slug], /articles/[slug], /analyses/[id], /share/[id]）は
 * 一覧・固定ページのみここに含める。
 *
 * permissionDetails（管理者向け備忘録）:
 * - 先頭: アクセス矩陣（Guest / Free / Premium は ✅ 可 / ⚠️ 制限あり / ⛔ 不可。管理画面のみ末尾に Admin）
 * - 以降: 実装メモ（ファイル名・定数・挙動の具体値）
 */

export type RouteRequiredRole = "public" | "free" | "premium" | "admin";

/** フッター4列のカテゴリ（表示順は FOOTER_CATEGORY_ORDER） */
export type RouteCategory =
  | "プロダクト"
  | "アカウント・学習"
  | "サポート・規約"
  | "管理者設定";

export const FOOTER_CATEGORY_ORDER: readonly RouteCategory[] = [
  "プロダクト",
  "アカウント・学習",
  "サポート・規約",
  "管理者設定",
] as const;

export interface AppRouteConfig {
  title: string;
  href: string;
  requiredRole: RouteRequiredRole;
  category: RouteCategory;
  /**
   * 権限説明（管理者 HoverCard 用）
   * - 先頭要素: 矩陣行（【閲覧権限】直下。Guest ⛔｜Free ⚠️｜Premium ✅ 形式）
   * - 2件目以降: 実装備忘録（箇条書き）
   */
  permissionDetails: readonly string[];
  /** フッターサイトマップで王冠を表示（全ロール共通・ナビの厳選ライブラリ行と同じアイコン） */
  premiumCrownInFooter?: boolean;
}

/** 主要ページ（カテゴリ内は UI 上でソート可能だが、ここでは登録順を維持） */
export const APP_ROUTES: AppRouteConfig[] = [
  {
    title: "トップ",
    href: "/",
    requiredRole: "public",
    category: "プロダクト",
    permissionDetails: [
      "Guest ⚠️ ｜ Free ⚠️ ｜ Premium ✅",
      "Guest は AI 解析を実行不可。`app/actions/check-quota.ts` の `consumeQuotaAction` が `reason: \"guest\"` でブロック。",
      "Free は累計解析が 3 件まで（`lib/quota-config.ts` の `FREE_ANALYSIS_LIMIT`＝保存済み `saved_analyses` 行数でカウント）。月次リセットではない。",
      "Premium（課金済み）は実装上は無制限扱いの分岐あり（`isPro`・Stripe 連携は TODO コメント参照）。",
    ],
  },
  {
    title: "このサービスについて",
    href: "/about",
    requiredRole: "public",
    category: "プロダクト",
    permissionDetails: [
      "Guest ✅ ｜ Free ✅ ｜ Premium ✅",
      "静的マーケページ。`middleware.ts` の公開ルート。追加のロールガードなし。",
    ],
  },
  {
    title: "サンプル動画一覧",
    href: "/examples",
    requiredRole: "public",
    category: "プロダクト",
    permissionDetails: [
      "Guest ⚠️ ｜ Free ✅ ｜ Premium ✅",
      "一覧・各 `/examples/[slug]` は公開。サンプル上の単語帳保存は Guest でもローカル可（`lib/vocabulary.ts`）。",
      "Guest のローカル保存は同日あたり `FREE_DAILY_LIMIT`（現在 5）件までのガードあり。ログイン後は `saveVocabularyAction` で Supabase 同期の流れ。",
    ],
  },
  {
    title: "記事一覧",
    href: "/articles",
    requiredRole: "public",
    category: "プロダクト",
    permissionDetails: [
      "Guest ⚠️ ｜ Free ✅ ｜ Premium ✅",
      "`docs/specifications.md` §3: Guest はチラ見せ UI・ログイン誘導。Free / Premium は記事閲覧フル。",
      "記事本文ルート `/articles/[slug]` も middleware 上は公開。公開スラッグは DB 側の公開状態に依存。",
    ],
  },
  {
    title: "厳選表現ライブラリ",
    href: "/library",
    requiredRole: "public",
    category: "プロダクト",
    premiumCrownInFooter: true,
    permissionDetails: [
      "Guest ⚠️ ｜ Free ⚠️ ｜ Premium ✅",
      "フル閲覧は Premium のみ: `isLibraryPremiumAccess`（`lib/library-premium.ts`）で `stripeSubscriptionStatus === \"active\"` 等を判定。",
      "Guest / Free（非 Premium）は `app/library/page.tsx` で本文をブラー＋オーバーレイ（`showPremiumTeaser`）。件数ベースの 3/10 件ではなく「プレミアムか否か」の二択 UI。",
    ],
  },
  {
    title: "マイ単語帳",
    href: "/vocabulary",
    requiredRole: "free",
    category: "アカウント・学習",
    permissionDetails: [
      "Guest ⛔ ｜ Free ⚠️ ｜ Premium ✅",
      "`middleware.ts` で非公開ルートのため未ログインは `auth.protect()`。ページ到達前にブロック。",
      "会員のデータは Clerk ＋ Supabase 同期（仕様書 §4）。ローカル枠の日次上限は `FREE_DAILY_LIMIT`（`lib/vocabulary.ts`）。",
    ],
  },
  {
    title: "アップグレード",
    href: "/upgrade",
    requiredRole: "public",
    category: "アカウント・学習",
    permissionDetails: [
      "Guest ✅ ｜ Free ✅ ｜ Premium ✅",
      "プラン案内・Waitlist 用。`middleware` 公開。商品ロジックの強制ガードは別ページに委譲。",
    ],
  },
  {
    title: "利用規約",
    href: "/terms",
    requiredRole: "public",
    category: "サポート・規約",
    permissionDetails: [
      "Guest ✅ ｜ Free ✅ ｜ Premium ✅",
      "法的表記。公開ルート。ロールによる差分なし。",
    ],
  },
  {
    title: "プライバシーポリシー",
    href: "/privacy",
    requiredRole: "public",
    category: "サポート・規約",
    permissionDetails: [
      "Guest ✅ ｜ Free ✅ ｜ Premium ✅",
      "法的表記。公開ルート。ロールによる差分なし。",
    ],
  },
  {
    title: "管理ダッシュボード",
    href: "/admin",
    requiredRole: "admin",
    category: "管理者設定",
    permissionDetails: [
      "Guest ⛔ ｜ Free ⛔ ｜ Premium ⛔ ｜ Admin ✅",
      "`lib/is-app-admin.ts` の `isAppAdminUser`: `NEXT_PUBLIC_ADMIN_USER_ID` と一致、または `publicMetadata.role === \"admin\"`。",
      "`app/admin/page.tsx` で非管理者は `/` へリダイレクト。",
    ],
  },
  {
    title: "承認キュー",
    href: "/admin/approvals",
    requiredRole: "admin",
    category: "管理者設定",
    permissionDetails: [
      "Guest ⛔ ｜ Free ⛔ ｜ Premium ⛔ ｜ Admin ✅",
      "公開解析の審査 UI。ガードは管理ダッシュボードと同一（`isAppAdminUser`）。",
    ],
  },
];

/** 非管理者のフッターから除外するロール */
export function isRouteVisibleInPublicFooter(role: RouteRequiredRole): boolean {
  return role !== "admin";
}

export function routesGroupedByCategory(
  routes: readonly AppRouteConfig[]
): { category: RouteCategory; routes: AppRouteConfig[] }[] {
  return FOOTER_CATEGORY_ORDER.map((category) => ({
    category,
    routes: routes.filter((r) => r.category === category),
  })).filter((g) => g.routes.length > 0);
}
