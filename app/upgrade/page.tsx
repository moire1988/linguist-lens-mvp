import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { PricingPlanComparison } from "@/components/pricing-plan-comparison";

export const metadata = {
  title: "アップグレード | LinguistLens",
  description: "プレミアムプラン（準備中）",
};

export default function UpgradePlaceholderPage() {
  return (
    <div className="min-h-screen relative">
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center mb-12 sm:mb-16">
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">
            Premium
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
            アップグレード
          </h1>
          <p className="text-sm text-slate-600 mb-2">
            プレミアムプランの詳細は準備中です。
          </p>
          <p className="text-xs text-slate-500">
            リリース時に優先案内を受け取るには、Waitlistにご登録ください。
          </p>
        </div>

        <section className="mb-12 sm:mb-16">
          <PricingPlanComparison />
        </section>

        <div className="max-w-lg mx-auto text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            トップへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
