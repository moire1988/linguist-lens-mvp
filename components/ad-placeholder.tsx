import { cn } from "@/lib/utils";

interface AdPlaceholderProps {
  slot?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AdPlaceholder({
  slot = "バナー",
  className,
  size = "md",
}: AdPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center",
        size === "sm" && "py-3 px-4",
        size === "md" && "py-5 px-6",
        size === "lg" && "py-8 px-6",
        className
      )}
    >
      <span className="text-lg mb-1">📢</span>
      <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
        広告エリア
      </p>
      <p className="text-[10px] text-slate-300 mt-0.5">{slot}</p>
    </div>
  );
}
