/** CEFR コード別の日本語ガイドとバッジ用 Tailwind クラス（examples / analyses で共有） */
export const CEFR_CONTENT_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  A1: {
    label: "入門",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  A2: {
    label: "初級",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
  },
  B1: {
    label: "中級",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  B2: {
    label: "中上級",
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  C1: {
    label: "上級",
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  C2: {
    label: "熟達",
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
  },
};
