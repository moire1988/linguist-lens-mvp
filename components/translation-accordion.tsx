"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranslationAccordionProps {
  text: string;
  variant?: "slate" | "indigo";
}

export function TranslationAccordion({ text, variant = "slate" }: TranslationAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 text-[10px] font-medium transition-colors",
          variant === "indigo"
            ? "text-indigo-400 hover:text-indigo-600"
            : "text-slate-400 hover:text-slate-600"
        )}
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
        日本語訳
      </button>
      {open && (
        <p
          className={cn(
            "text-xs leading-relaxed mt-1",
            variant === "indigo" ? "text-indigo-600/80" : "text-slate-500"
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}
