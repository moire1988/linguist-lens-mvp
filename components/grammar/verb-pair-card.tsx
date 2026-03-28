import type { VerbPair, VerbPairExample } from "@/lib/grammar-lesson";
import { cn } from "@/lib/utils";

export interface VerbPairCardProps {
  pair: VerbPair;
}

function sceneLabel(scene: VerbPairExample["scene"]): string {
  switch (scene) {
    case "daily":
      return "日常";
    case "business":
      return "ビジネス";
    case "academic":
      return "学術";
    default:
      return scene;
  }
}

function ExampleRow({ ex }: { ex: VerbPairExample }) {
  const isWrong = ex.isCorrect === false;
  const hasWarning = Boolean(ex.warningNote);

  const rowBg = isWrong
    ? "bg-red-50/90 border-red-100"
    : hasWarning
      ? "bg-amber-50/80 border-amber-100"
      : "bg-white border-slate-100";

  const badge = isWrong ? (
    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border border-red-200 bg-red-100 text-red-800">
      ❌ 間違い
    </span>
  ) : hasWarning ? (
    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-200 bg-amber-100 text-amber-900">
      ⚠️ 注意
    </span>
  ) : (
    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
      ✅ 正しい
    </span>
  );

  return (
    <tr className={cn("border-b border-slate-100 last:border-0", rowBg)}>
      <td className="p-3 align-top w-14">
        <span
          className={cn(
            "text-[10px] font-bold font-mono uppercase",
            ex.form === "ing" ? "text-indigo-600" : "text-violet-600"
          )}
        >
          {ex.form}
        </span>
      </td>
      <td className="p-3 align-top">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          {badge}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600">
            {sceneLabel(ex.scene)}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-900 leading-snug">
          {ex.sentence}
        </p>
        <p className="text-xs text-slate-500 mt-1">{ex.translation}</p>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {ex.nuanceNote}
        </p>
        {ex.warningNote ? (
          <p className="text-xs text-amber-900 mt-2 font-medium leading-relaxed">
            {ex.warningNote}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

export function VerbPairCard({ pair }: VerbPairCardProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden mb-8">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900 font-mono tracking-tight">
          {pair.verb}
        </h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {pair.coreInsight}
        </p>
      </div>
      <div className="p-5 grid md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">
            -ing のイメージ
          </p>
          <p className="text-slate-700 leading-relaxed">{pair.ingImage}</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
          <p className="text-[10px] font-bold text-violet-600 uppercase mb-2">
            to のイメージ
          </p>
          <p className="text-slate-700 leading-relaxed">{pair.toImage}</p>
        </div>
      </div>
      <div className="px-2 sm:px-4 pb-4 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[280px]">
          <tbody>{pair.examples.map((ex, i) => <ExampleRow key={i} ex={ex} />)}</tbody>
        </table>
      </div>
    </section>
  );
}
