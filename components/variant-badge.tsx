"use client";

import type { EnglishVariant } from "@/lib/article-types";

const VARIANT_META: Record<
  EnglishVariant,
  { flag: string; label: string; desc: string; color: string }
> = {
  US: {
    flag:  "🇺🇸",
    label: "アメリカ英語",
    desc:  "アメリカ式のスペル・語彙・表現を使用しています（color, elevator, vacation など）",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  UK: {
    flag:  "🇬🇧",
    label: "イギリス英語",
    desc:  "イギリス式のスペル・語彙・表現を使用しています（colour, lift, holiday など）",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  AU: {
    flag:  "🇦🇺",
    label: "オーストラリア英語",
    desc:  "オーストラリア式のスペル・語彙・表現を使用しています（arvo, biscuit, servo など）",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  common: {
    flag:  "🌐",
    label: "共通英語",
    desc:  "特定の地域に偏らない、国際的に通用するニュートラルな英語表現を使用しています",
    color: "bg-slate-50 text-slate-600 border-slate-200",
  },
};

export function VariantBadge({
  variant,
  size = "md",
}: {
  variant: EnglishVariant;
  size?: "sm" | "md";
}) {
  const meta = VARIANT_META[variant] ?? VARIANT_META.common;
  const badgeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <div className="relative inline-block group">
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full border cursor-help select-none ${badgeClass} ${meta.color}`}
      >
        <span>{meta.flag}</span>
        {variant === "common" ? "共通" : variant}
      </span>

      {/* Tooltip */}
      <div
        className="
          pointer-events-none absolute bottom-full left-0 mb-2 z-50
          w-60 rounded-xl bg-slate-800 text-white shadow-xl
          opacity-0 group-hover:opacity-100
          translate-y-1 group-hover:translate-y-0
          transition-all duration-150
          text-xs leading-relaxed p-3
        "
      >
        <p className="font-bold text-sm mb-1">
          {meta.flag} {meta.label}
        </p>
        <p className="text-slate-300">{meta.desc}</p>
        {/* Arrow */}
        <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}
