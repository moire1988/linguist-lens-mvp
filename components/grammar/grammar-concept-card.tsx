import { cn } from "@/lib/utils";

export interface GrammarConceptCardProps {
  label: string;
  coreImage: string;
  metaphor: string;
  keyWords: string[];
  colorScheme: "indigo" | "violet";
}

const schemeClass: Record<
  GrammarConceptCardProps["colorScheme"],
  { border: string; bg: string; accent: string; tag: string }
> = {
  indigo: {
    border: "border-indigo-100",
    bg: "bg-gradient-to-br from-indigo-50/90 to-white",
    accent: "text-indigo-700",
    tag: "bg-indigo-100/80 text-indigo-800 border-indigo-200/60",
  },
  violet: {
    border: "border-violet-100",
    bg: "bg-gradient-to-br from-violet-50/90 to-white",
    accent: "text-violet-700",
    tag: "bg-violet-100/80 text-violet-800 border-violet-200/60",
  },
};

export function GrammarConceptCard({
  label,
  coreImage,
  metaphor,
  keyWords,
  colorScheme,
}: GrammarConceptCardProps) {
  const s = schemeClass[colorScheme];
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col gap-3",
        s.border,
        s.bg
      )}
    >
      <p className={cn("text-xs font-bold uppercase tracking-wide", s.accent)}>
        {label}
      </p>
      <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
        {coreImage}
      </p>
      <p className="text-sm text-slate-600 italic leading-relaxed border-l-2 border-slate-200 pl-3">
        {metaphor}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {keyWords.map((kw) => (
          <span
            key={kw}
            className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-full border",
              s.tag
            )}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
