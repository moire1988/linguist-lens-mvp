"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useEffectiveAuth } from "@/lib/dev-auth";
import { cn } from "@/lib/utils";

/**
 * テスト用: `'auto'` = Clerk の publicMetadata を使用。
 * `'free'` / `'premium'` にすると UI のみ強制（開発時の見た目確認用）。
 * DEV パネルで Pro を選んだ場合も `useEffectiveAuth().isPro` によりプレミアム表示。
 */
export const MEMBERSHIP_TEST_OVERRIDE: "auto" | "free" | "premium" = "auto";

type PublicMetadataShape = {
  stripeSubscriptionStatus?: string;
};

function resolveIsPremium(
  testOverride: typeof MEMBERSHIP_TEST_OVERRIDE,
  stripeStatus: string | undefined
): boolean {
  if (testOverride === "premium") return true;
  if (testOverride === "free") return false;
  return stripeStatus === "active";
}

export function MembershipStatusNav({
  variant = "default",
}: {
  variant?: "default" | "drawer";
}) {
  const { user, isLoaded } = useUser();
  const { isPro: devProSimulated } = useEffectiveAuth();
  const onGradient = variant === "drawer";

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "rounded-xl px-3 py-2.5",
          onGradient
            ? "border border-white/10 bg-white/5"
            : "mx-2 mb-1 border border-slate-100 bg-slate-50/80"
        )}
      >
        <div className="h-3.5 w-24 animate-pulse rounded bg-white/20" />
        <div className="mt-2 h-8 w-full animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  if (!user) return null;

  const meta = (user.publicMetadata ?? {}) as PublicMetadataShape;
  const stripeStatus = meta.stripeSubscriptionStatus;
  /** DEV パネルで Pro のときは Stripe より先にプレミアム UI（ライブラリと同じ） */
  const isPremium =
    devProSimulated ||
    resolveIsPremium(MEMBERSHIP_TEST_OVERRIDE, stripeStatus);

  const shell = onGradient
    ? "rounded-xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur-sm shadow-inner shadow-black/10"
    : "mx-2 mb-1 rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-3 py-2.5 shadow-sm";

  return (
    <div className={shell}>
      {isPremium ? (
        <>
          <div className="flex items-center gap-2">
            <Crown
              className={cn(
                "h-4 w-4 shrink-0",
                onGradient ? "text-amber-300" : "text-amber-500"
              )}
              aria-hidden
            />
            <span
              className={cn(
                "text-sm font-bold tracking-tight bg-clip-text text-transparent",
                onGradient
                  ? "bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-100"
                  : "bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600"
              )}
            >
              プレミアム会員
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (process.env.NODE_ENV === "development") {
                console.log("[membership] サブスクリプション管理（準備中）");
              }
              alert("準備中");
            }}
            className={cn(
              "mt-2 w-full text-left text-[11px] underline underline-offset-2 transition-colors",
              onGradient
                ? "text-violet-200/90 hover:text-white decoration-white/30"
                : "text-slate-400 hover:text-slate-600 decoration-slate-300 hover:decoration-slate-500"
            )}
          >
            サブスクリプションを管理
          </button>
        </>
      ) : (
        <>
          <p
            className={cn(
              "text-xs font-semibold",
              onGradient ? "text-white/95" : "text-slate-600"
            )}
          >
            Free会員
          </p>
          <Link
            href="/upgrade"
            className={cn(
              "mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2",
              "text-xs font-bold text-white shadow-md",
              onGradient
                ? "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 shadow-black/20 hover:brightness-110"
                : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-indigo-500/25 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500",
              "transition-all duration-200 active:scale-[0.98]"
            )}
          >
            <span aria-hidden>⚡️</span>
            アップグレード
          </Link>
        </>
      )}
    </div>
  );
}
