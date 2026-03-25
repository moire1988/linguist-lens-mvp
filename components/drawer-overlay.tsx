"use client";

/**
 * ヘッダー直下から画面下までを覆うオーバーレイ（ぼかし＋半透明）。
 * ヘッダー（h-14）より上は触れず、ロゴやブランド帯はそのまま操作可能。
 */
export function DrawerOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <button
      type="button"
      aria-label="メニューを閉じる"
      className="fixed top-14 left-0 right-0 bottom-0 z-[100] bg-slate-950/45 backdrop-blur-md"
      onClick={onClose}
    />
  );
}
