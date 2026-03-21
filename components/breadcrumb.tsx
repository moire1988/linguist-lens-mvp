import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mb-6 flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-indigo-500 transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-600 truncate" : "truncate"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
