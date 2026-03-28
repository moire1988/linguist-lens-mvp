"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const GRAMMAR_MD_COMPONENTS: Components = {
  p({ children }: { children?: ReactNode }) {
    return (
      <p className="mb-3 text-sm leading-relaxed text-slate-700 last:mb-0">
        {children}
      </p>
    );
  },
  strong({ children }: { children?: ReactNode }) {
    return (
      <strong className="font-semibold text-slate-900">{children}</strong>
    );
  },
  em({ children }: { children?: ReactNode }) {
    return <em className="italic text-slate-600">{children}</em>;
  },
  ul({ children }: { children?: ReactNode }) {
    return (
      <ul className="mb-3 mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700 last:mb-0">
        {children}
      </ul>
    );
  },
  ol({ children }: { children?: ReactNode }) {
    return (
      <ol className="mb-3 mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700 last:mb-0">
        {children}
      </ol>
    );
  },
  li({ children }: { children?: ReactNode }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  h2({ children }: { children?: ReactNode }) {
    return (
      <h3 className="mb-2 mt-4 text-sm font-bold text-slate-800 first:mt-0">
        {children}
      </h3>
    );
  },
  table({ children }: { children?: ReactNode }) {
    return (
      <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[320px]">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }: { children?: ReactNode }) {
    return (
      <thead className="bg-slate-50 border-b border-slate-200">{children}</thead>
    );
  },
  tbody({ children }: { children?: ReactNode }) {
    return <tbody>{children}</tbody>;
  },
  th({ children }: { children?: ReactNode }) {
    return (
      <th className="px-3 py-2 font-semibold text-slate-800 text-left border-b border-slate-100">
        {children}
      </th>
    );
  },
  td({ children }: { children?: ReactNode }) {
    return (
      <td className="px-3 py-2 text-slate-700 border-b border-slate-100 align-top">
        {children}
      </td>
    );
  },
  tr({ children }: { children?: ReactNode }) {
    return <tr>{children}</tr>;
  },
};

export function GrammarSectionMarkdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={GRAMMAR_MD_COMPONENTS}
    >
      {source}
    </ReactMarkdown>
  );
}
