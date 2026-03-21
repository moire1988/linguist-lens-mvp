"use client";

// ─── CEFR メタ情報 ────────────────────────────────────────────────────────────

const CEFR_INFO: Record<
  string,
  { label: string; toeic: string; toefl: string; desc: string }
> = {
  A1: {
    label: "入門",
    toeic: "〜225点",
    toefl: "—",
    desc:  "基本的な挨拶や日常的な短い表現が理解できる初歩レベル",
  },
  A2: {
    label: "初級",
    toeic: "225〜549点",
    toefl: "〜41点",
    desc:  "身近な話題について簡単なやり取りができる",
  },
  B1: {
    label: "中級",
    toeic: "550〜780点",
    toefl: "42〜71点",
    desc:  "日常・仕事の場面で要点を理解し自分の意見を伝えられる",
  },
  B2: {
    label: "中上級",
    toeic: "785〜940点",
    toefl: "72〜94点",
    desc:  "複雑な内容も理解でき、母語話者と自然に会話できる",
  },
  C1: {
    label: "上級",
    toeic: "945〜990点",
    toefl: "95〜120点",
    desc:  "様々なジャンルの長い文章を即座に理解し流暢に表現できる",
  },
  C2: {
    label: "最上級",
    toeic: "ネイティブ相当",
    toefl: "ネイティブ相当",
    desc:  "ほぼネイティブ同等。微妙なニュアンスも自在に使いこなせる",
  },
};

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-100  text-slate-600  border-slate-200",
  A2: "bg-green-100  text-green-700  border-green-200",
  B1: "bg-blue-100   text-blue-700   border-blue-200",
  B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  C1: "bg-purple-100 text-purple-700 border-purple-200",
  C2: "bg-rose-100   text-rose-700   border-rose-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CefrBadge({
  level,
  size = "md",
}: {
  level: string;
  size?: "sm" | "md";
}) {
  const info = CEFR_INFO[level];
  const color = CEFR_COLORS[level] ?? "bg-slate-100 text-slate-600 border-slate-200";

  const badgeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-xs";

  return (
    <div className="relative inline-block group">
      {/* Badge */}
      <span
        className={`inline-flex items-center gap-1 font-mono font-bold rounded-full border cursor-help select-none ${badgeClass} ${color}`}
      >
        <span className="opacity-50 font-semibold" style={{ fontSize: "0.65em" }}>
          CEFR
        </span>
        {level}
        {info && (
          <span className="opacity-60 font-normal">
            {info.label}
          </span>
        )}
      </span>

      {/* Tooltip */}
      {info && (
        <div
          className="
            pointer-events-none absolute bottom-full left-0 mb-2 z-50
            w-56 rounded-xl bg-slate-800 text-white shadow-xl
            opacity-0 group-hover:opacity-100
            translate-y-1 group-hover:translate-y-0
            transition-all duration-150
            text-xs leading-relaxed p-3
          "
        >
          <p className="font-bold text-sm mb-1">
            CEFR {level}（{info.label}）
          </p>
          <p className="text-slate-300 mb-2">{info.desc}</p>
          <div className="border-t border-slate-600 pt-2 space-y-0.5 text-[11px] text-slate-400">
            <p>TOEIC：{info.toeic}</p>
            {info.toefl !== "—" && <p>TOEFL：{info.toefl}</p>}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
