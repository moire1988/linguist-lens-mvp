"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Star, Send, MessageSquare } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { submitFeedback } from "@/app/actions/feedback";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "feature", label: "機能の要望" },
  { value: "bug",     label: "バグ報告" },
  { value: "cheer",   label: "応援メッセージ" },
  { value: "other",   label: "その他" },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function FeedbackModal() {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen]           = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [category, setCategory]   = useState("feature");
  const [rating, setRating]       = useState(0);
  const [hover, setHover]         = useState(0);
  const [comment, setComment]     = useState("");

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset after animation (no animation here, instant)
    setTimeout(() => {
      setSubmitted(false);
      setCategory("feature");
      setRating(0);
      setHover(0);
      setComment("");
      setError(null);
    }, 150);
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim() || loading) return;
    setLoading(true);
    setError(null);
    const result = await submitFeedback({ category, rating, comment: comment.trim() });
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "送信に失敗しました。もう一度お試しください。");
    }
  };

  // ログイン済みユーザーにのみ表示
  if (!isLoaded || !isSignedIn) return null;

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-full shadow-md text-xs font-medium text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        フィードバック
      </button>

      {/* ── Modal ────────────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-[440px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 leading-snug">
                    開発者にメッセージを送る 💌
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    『こんな機能が欲しい！』『ここが使いにくい』など、<br />
                    いつでもお待ちしています！
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="ml-4 mt-0.5 shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="閉じる"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pb-6">
                {submitted ? (
                  /* ── Success state ─────────────────────────────────── */
                  <div className="py-4 text-center space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      ありがとうございます！<br />
                      開発者が泣いて喜びながら<br className="sm:hidden" />
                      読ませていただきます😭✨
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                ) : (
                  /* ── Form ───────────────────────────────────────────── */
                  <div className="space-y-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        カテゴリー
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Star rating */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        評価
                        <span className="ml-1 font-normal text-slate-400">（任意）</span>
                      </label>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n === rating ? 0 : n)}
                            onMouseEnter={() => setHover(n)}
                            onMouseLeave={() => setHover(0)}
                            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                            aria-label={`${n}星`}
                          >
                            <Star
                              className={`h-7 w-7 transition-colors ${
                                n <= (hover || rating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          </button>
                        ))}
                        {(hover || rating) > 0 && (
                          <span className="ml-2 text-xs text-slate-400">
                            {["", "不満", "やや不満", "普通", "満足", "大満足"][hover || rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        コメント
                        <span className="ml-1 font-normal text-red-400">（必須）</span>
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="自由にお書きください..."
                        rows={4}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none transition"
                      />
                      <p className="mt-1 text-right text-xs text-slate-300">
                        {comment.length} / 1000
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-xs text-red-500">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !comment.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {loading ? (
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          送信する
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
