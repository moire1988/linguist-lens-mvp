/**
 * 解析詳細ページ用：AI コーチからのワンパス生成コメント（吹き出し風）
 */

interface AnalysisCoachCalloutProps {
  text: string;
}

export function AnalysisCoachCallout({ text }: AnalysisCoachCalloutProps) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <aside
      className="relative mb-8 overflow-hidden rounded-2xl border border-purple-200/90 border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 via-purple-50/90 to-indigo-50/70 px-5 py-4 shadow-sm sm:px-6 sm:py-5"
      aria-label="AIコーチからのメッセージ"
    >
      <div
        className="pointer-events-none absolute -right-4 top-0 h-20 w-20 rounded-full bg-purple-300/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex gap-3 sm:gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-200/80 bg-white text-xl shadow-sm sm:h-12 sm:w-12"
          aria-hidden
        >
          <span className="select-none">👩‍🏫</span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-purple-700/90">
            AI Coach
            <span className="text-base leading-none opacity-70" aria-hidden>
              🤖
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800 sm:text-[15px]">
            {trimmed}
          </p>
        </div>
      </div>
    </aside>
  );
}
