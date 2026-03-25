import Link from "next/link";
import { LinguistLensLogo } from "@/components/linguist-lens-logo";

// ─── Width variants (match your page's main content width) ───────────────────

const MAX_W: Record<string, string> = {
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
  /** Inner container max-width — should match the page's <main> max-width */
  maxWidth?: "3xl" | "5xl";
  /** Left slot. Defaults to the LinguistLens logo. */
  left?: React.ReactNode;
  /** Right slot — page-specific actions, auth controls, etc. */
  right?: React.ReactNode;
}

// ─── Default logo ─────────────────────────────────────────────────────────────

export function HeaderLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 group"
    >
      <LinguistLensLogo size={28} className="transition-transform group-hover:scale-105" />
      <span style={{ fontFamily: "var(--font-goldman)", fontWeight: 400, color: "#1A2D42" }}>LinguistLens</span>
    </Link>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SiteHeader({ maxWidth = "5xl", left, right }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div
        className={`${MAX_W[maxWidth]} mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3`}
      >
        {/* Left slot */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {left ?? <HeaderLogo />}
        </div>

        {/* Right slot */}
        {right != null && (
          <div className="flex items-center gap-2 shrink-0">
            {right}
          </div>
        )}
      </div>
    </header>
  );
}
