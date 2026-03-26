"use client";

import { X, Bookmark } from "lucide-react";
import { WaitlistCta } from "@/components/waitlist-cta";
import { ModalPortal } from "@/components/modal-portal";

interface PremiumWaitlistModalProps {
  onClose: () => void;
}

/**
 * Premium 限定「お気に入り」の Fake Door。`WaitlistCta` と同じ登録フローを内包する。
 */
export function PremiumWaitlistModal({ onClose }: PremiumWaitlistModalProps) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-waitlist-title"
        >
          <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 pb-8 pt-6 text-center">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Bookmark className="h-7 w-7 text-yellow-200" />
            </div>
            <h2
              id="premium-waitlist-title"
              className="text-xl font-bold text-white"
            >
              お気に入り（Premium）
            </h2>
            <p className="mt-2 text-sm text-indigo-100">
              開発中の機能です。正式リリース時に優先案内を受け取るには、Waitlist
              にご登録ください。
            </p>
          </div>

          <div className="px-6 py-5">
            <WaitlistCta />
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
