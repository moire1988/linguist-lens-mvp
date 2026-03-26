"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Info } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  APP_ROUTES,
  isRouteVisibleInPublicFooter,
  routesGroupedByCategory,
  type AppRouteConfig,
} from "@/lib/routes-config";
import { isAppAdminUser } from "@/lib/is-app-admin";
import { useEffectiveAuth } from "@/lib/dev-auth";
import { getSettings } from "@/lib/settings";
import {
  isFooterRouteVisuallyRestricted,
  shouldShowFooterPremiumCrown,
  type FooterEffectiveContext,
} from "@/lib/footer-sitemap-access";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

function RoutePermissionHoverBody({
  permissionDetails,
}: {
  permissionDetails: readonly string[];
}) {
  if (permissionDetails.length === 0) return null;
  const [matrixLine, ...bullets] = permissionDetails;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold tracking-tight text-slate-800">
        【閲覧権限】
      </p>
      <p className="text-[11px] leading-relaxed text-slate-600">{matrixLine}</p>
      {bullets.length > 0 && (
        <ul className="list-disc space-y-1 border-t border-slate-100 pt-2 pl-3.5 text-[11px] leading-relaxed text-slate-500 marker:text-slate-300">
          {bullets.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const baseLinkClass =
  "min-w-0 truncate text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30 focus-visible:ring-offset-1 rounded-sm";

function restrictedLinkTitle(route: AppRouteConfig): string {
  if (route.href === "/library") {
    return "プレミアム会員向け（フル閲覧）";
  }
  if (route.href === "/articles") {
    return "ログインでフル閲覧できます";
  }
  if (route.href === "/examples") {
    return "ログインで保存・同期など快適に利用できます";
  }
  if (route.requiredRole === "free") {
    return "ログインが必要です";
  }
  return "利用条件をご確認ください";
}

/** メニュー（`nav-menu.tsx`）のプレミアム行と同一スタイルの王冠 */
function FooterPremiumCrown() {
  return (
    <>
      <span className="sr-only">（プレミアム会員限定）</span>
      <span
        className="inline-flex shrink-0"
        title="プレミアム会員限定"
      >
        <Crown
          className="h-3.5 w-3.5 text-amber-400 drop-shadow-sm"
          aria-hidden
        />
      </span>
    </>
  );
}

function FooterRouteRow({
  route,
  showAdminHover,
  effectiveCtx,
}: {
  route: AppRouteConfig;
  showAdminHover: boolean;
  effectiveCtx: FooterEffectiveContext;
}) {
  const restricted = isFooterRouteVisuallyRestricted(route, effectiveCtx);
  const showCrown = shouldShowFooterPremiumCrown(route);

  const linkClass = cn(
    baseLinkClass,
    "inline-flex max-w-full items-center gap-1",
    restricted
      ? "text-slate-400 opacity-80 hover:text-violet-500/80"
      : "text-slate-500 hover:text-violet-600/90"
  );

  if (!showAdminHover) {
    return (
      <li>
        <Link
          href={route.href}
          className={linkClass}
          title={restricted ? restrictedLinkTitle(route) : undefined}
        >
          <span className="min-w-0 truncate">{route.title}</span>
          {showCrown && <FooterPremiumCrown />}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <HoverCard openDelay={200} closeDelay={80}>
        <HoverCardTrigger asChild>
          <Link
            href={route.href}
            className={cn(
              linkClass,
              "group inline-flex max-w-full items-center gap-1"
            )}
            title={restricted ? restrictedLinkTitle(route) : undefined}
          >
            <span className="min-w-0 truncate">{route.title}</span>
            {showCrown && <FooterPremiumCrown />}
            <Info
              className="size-3 shrink-0 text-slate-400/90 transition-colors group-hover:text-violet-500/85"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start">
          <RoutePermissionHoverBody permissionDetails={route.permissionDetails} />
        </HoverCardContent>
      </HoverCard>
    </li>
  );
}

export function FooterSitemap() {
  const { user, isLoaded } = useUser();
  const { isSignedIn: effSignedIn, isPro: effPro } = useEffectiveAuth();
  /** DEV 設定変更などで `useEffectiveAuth` / localStorage を再評価させるためのダミー */
  const [settingsRevision, setSettingsRevision] = useState(0);
  /** hydration 一致のため、マウント前は false 扱い（管理者 Hover もオフ） */
  const [footerMounted, setFooterMounted] = useState(false);
  /**
   * DEV で Guest/Free/Pro を再現中は true。管理者本人でもそのロールのフッターに揃える。
   * devAuthState === "real" または devMode OFF のときだけ管理者向けフッターを許可。
   */
  const [devPersonaSimulating, setDevPersonaSimulating] = useState(false);

  useEffect(() => {
    setFooterMounted(true);
  }, []);

  useEffect(() => {
    const bump = () => setSettingsRevision((n) => n + 1);
    window.addEventListener("ll-settings-changed", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("ll-settings-changed", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    if (!footerMounted) return;
    const s = getSettings();
    setDevPersonaSimulating(s.devMode === true && s.devAuthState !== "real");
  }, [footerMounted, settingsRevision]);

  const effectiveCtx: FooterEffectiveContext = {
    isSignedIn: effSignedIn,
    isPro: effPro,
  };

  /** Clerk 上の管理者（実ユーザー） */
  const realAppAdmin =
    footerMounted &&
    isLoaded &&
    isAppAdminUser(
      user?.id,
      user?.publicMetadata as Record<string, unknown> | undefined
    );

  /**
   * 管理者向けサイトマップ（/admin 等）と権限 HoverCard（ℹ️）は、
   * 実効ロールが「ログイン相当」のときだけ。DEV Guest では Guest と同じ一覧のみ。
   */
  const showAdminFooterUx =
    realAppAdmin && effSignedIn && !devPersonaSimulating;

  const routes = showAdminFooterUx
    ? APP_ROUTES
    : APP_ROUTES.filter((r) => isRouteVisibleInPublicFooter(r.requiredRole));

  const grouped = routesGroupedByCategory(routes);

  return (
    <div className="mb-5 w-full border-b border-slate-100/80 pb-5">
      <nav aria-label="サイト内主要ページ">
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
          {grouped.map(({ category, routes: catRoutes }) => (
            <div key={category} className="min-w-0">
              <h2 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {category}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {catRoutes.map((route) => (
                  <FooterRouteRow
                    key={route.href}
                    route={route}
                    showAdminHover={showAdminFooterUx}
                    effectiveCtx={effectiveCtx}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
