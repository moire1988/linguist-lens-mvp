"use client";

import { useState } from "react";
import { X, Sparkles, Check, Loader2, LogIn } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { registerWaitlistLoggedInAction } from "@/app/actions/waitlist";

interface ProWaitlistModalProps {
  onClose: () => void;
}

const PRO_FEATURES = [
  "全文の高精度翻訳（Claude Haiku）",
  "無制限の単語帳保存",
  "優先 AI モデルアクセス",
  "高度なフラッシュカード機能",
];

export function ProWaitlistModal({ onClose }: ProWaitlistModalProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const result = await registerWaitlistLoggedInAction();
    setIsLoading(false);
    if (!result.ok) {
      setErrorMsg(result.error ?? "登録に失敗しました");
      return;
    }
    setRegistered(true);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 px-6 pt-6 pb-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
            👑
          </div>
          <h2 className="text-xl font-bold text-white">
            この機能はProプラン限定です
          </h2>
          <p className="text-indigo-200 text-sm mt-1.5 leading-relaxed">
            準備中のProプランで利用可能になります
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            全文の高精度翻訳（Claude Haiku）や、無制限の単語保存などの機能を利用できる
            <span className="font-semibold text-indigo-600">Proプラン</span>
            を準備中です。ウェイティングリストに登録して、リリース時にお知らせを受け取りますか？
          </p>

          {/* Feature list */}
          <ul className="space-y-2 mb-5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA area */}
          {registered ? (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700">
                登録しました！リリース時にお知らせします 🎉
              </p>
            </div>
          ) : isSignedIn ? (
            <>
              {errorMsg && (
                <p className="text-xs text-rose-600 mb-2">{errorMsg}</p>
              )}
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    登録中...
                  </>
                ) : (
                  "リストに登録する"
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => { onClose(); openSignIn(); }}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-3"
            >
              <LogIn className="h-4 w-4" />
              ログインして登録する
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
