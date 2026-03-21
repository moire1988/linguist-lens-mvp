"use client";

import { useAuth } from "@clerk/nextjs";

// ─── 課金状態の判定 ───────────────────────────────────────────────────────────
// TODO: 課金システム実装後にここを更新する。
// 例: Clerk publicMetadata の isPaid フラグ、または Supabase の subscriptions テーブルを参照する。

function useIsPaid(): boolean {
  useAuth(); // 将来の課金チェックで userId などを使うためにフックを呼んでおく
  return false; // ダミー: 全員に広告を表示
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdBannerProps {
  /** 広告スロットの表示位置を区別するための識別子（将来のAdSense設定用） */
  slot?: string;
  className?: string;
}

export function AdBanner({ className: _className = "" }: AdBannerProps) {
  useIsPaid(); // フック呼び出しの順序を維持
  // TODO: AdSense 準備完了後に広告コードを実装する
  return null;
}
