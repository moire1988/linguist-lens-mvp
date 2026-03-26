import Link from "next/link";
import { FooterSitemap } from "@/components/footer-sitemap";

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-slate-200/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-6 pb-5 pt-8">
        <FooterSitemap />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Left: brand + copyright */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-tight text-slate-700">
              LinguistLens
            </span>
            <span className="select-none text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-400">© 2026 LinguistLens</span>
          </div>

          {/* Right: nav links */}
          <nav className="flex items-center gap-5">
            <a
              href="https://x.com/LinguistLens"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="text-slate-400 transition-colors hover:text-violet-600"
            >
              <XIcon />
            </a>
            <Link
              href="/terms"
              className="text-xs text-slate-400 transition-colors hover:text-violet-600"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-slate-400 transition-colors hover:text-violet-600"
            >
              プライバシーポリシー
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
