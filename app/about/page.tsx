"use client";

import type { ReactNode, ElementType } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles,
  Brain,
  BookMarked,
  ArrowRight,
  Youtube,
  Zap,
  CheckSquare,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import { LinguistLensLogo } from "@/components/linguist-lens-logo";
import { PricingPlanComparison } from "@/components/pricing-plan-comparison";

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.13 } },
};

const slideLeft: Variants = {
  hidden:  { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.55, ease: EASE } },
};

// ─── Helper Components ────────────────────────────────────────────────────────

/** スクロールトリガーのスタガーコンテナ */
function ScrollSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** FadeUp の個別要素 */
function FadeUp({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

/** 悩みリストアイテム */
function PainItem({ text }: { text: string }) {
  return (
    <motion.li
      variants={slideLeft}
      className="flex items-start gap-3 px-5 py-4 rounded-xl border border-slate-200 bg-slate-50"
    >
      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-indigo-500 bg-indigo-50 flex items-center justify-center">
        <CheckSquare className="w-3 h-3 text-indigo-500" />
      </span>
      <span className="text-slate-700 text-sm leading-relaxed">{text}</span>
    </motion.li>
  );
}

/** Step カード */
function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-[0_4px_24px_rgba(99,102,241,0.12)] transition-all duration-300"
    >
      {/* Step badge */}
      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full w-fit">
        {step}
      </span>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-indigo-200 flex items-center justify-center group-hover:from-violet-200 group-hover:to-indigo-200 transition-all">
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>

      <div>
        <h3 className="text-slate-900 font-bold text-base mb-2 leading-snug">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Corner accent lines */}
      <div className="absolute top-0 right-0 w-14 h-14 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute top-0 right-0 w-px h-14 bg-gradient-to-b from-indigo-400/30 to-transparent" />
        <div className="absolute top-0 right-0 h-px w-14 bg-gradient-to-l from-indigo-400/30 to-transparent" />
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { openSignIn } = useClerk();

  return (
    <div className="min-h-screen bg-transparent text-slate-900">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: Hero
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
      >
        {/* Radial center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)",
          }}
        />

        <ScrollSection className="relative z-10 text-center max-w-3xl mx-auto px-6 py-12 sm:py-20">
          <FadeUp>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-mono font-semibold tracking-wider mb-5 sm:mb-8">
              <Sparkles className="w-3 h-3" />
              初心者向けの英語アプリは、もう卒業しよう。
            </span>
          </FadeUp>

          <FadeUp>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.45] tracking-tight mb-4 sm:mb-6 text-slate-900">
              「読める・聞ける」を、
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                「使いこなせる」
              </span>
              に変える。
            </h1>
          </FadeUp>

          <FadeUp>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 sm:mb-12 max-w-xl mx-auto">
              LinguistLensは、英語の基礎を終えた中級者〜上級者のための、
              脱「The 日本人英語」SaaSです。
            </p>
          </FadeUp>

          <FadeUp>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => openSignIn()}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all duration-300 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                無料ではじめる
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-700 text-sm font-medium transition-all"
              >
                まず試してみる →
              </Link>
            </div>
          </FadeUp>
        </ScrollSection>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: Pains
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollSection>
            <FadeUp className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-3">
                ✦ Pain Points
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.45]">
                こんな「中級者の壁」に
                <br />
                ぶつかっていませんか？
              </h2>
            </FadeUp>

            <motion.ul
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-3"
            >
              {[
                "英語はそこそこ喋れるが、いつも同じ単語（I think... など）ばかり使ってしまう。",
                "マニアックな単語帳をひたすら暗記しているが、実際の会話でパッと出てこない。",
                "ネイティブのこなれた表現（Sounds like a plan! など）に憧れるが、使い所がわからない。",
                "世の中の英語学習サービスは「初心者向け」ばかりで物足りない。",
              ].map((text) => (
                <PainItem key={text} text={text} />
              ))}
            </motion.ul>
          </ScrollSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: Developer Story
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <ScrollSection className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 md:gap-16 items-start">

            {/* Avatar */}
            <FadeUp className="flex flex-col items-center md:items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center shadow-[0_4px_24px_rgba(99,102,241,0.2)] border border-indigo-200 select-none">
                  <LinguistLensLogo size={48} />
                </div>
                <div className="absolute -inset-2 rounded-[18px] border border-indigo-100 pointer-events-none" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-sm font-semibold text-slate-700">LinguistLens Creator</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Founder / Developer</p>
              </div>
            </FadeUp>

            {/* Text */}
            <div className="space-y-6">
              <FadeUp>
                <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-2">
                  ✦ Developer Story
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-[1.45] text-slate-900">
                  10年間の学習と、
                  <br />
                  外資系での葛藤から生まれました。
                </h2>
              </FadeUp>

              <FadeUp>
                <p className="text-slate-600 leading-relaxed">
                  私自身、10年以上の言語学習者です。バックパッカーで世界を巡り、
                  外資系企業で英語を使って仕事をしてきました。
                </p>
              </FadeUp>

              <FadeUp>
                <p className="text-slate-600 leading-relaxed">
                  しかし、常に先ほどの「悩み」を抱え続けていました。
                  単語はたくさん知っているはずなのに、ネイティブのような
                  自然でシンプルな表現がなぜか出てこない。
                </p>
              </FadeUp>

              <FadeUp>
                <blockquote className="border-l-2 border-indigo-500 pl-5 text-slate-700 font-medium leading-relaxed">
                  「どうすればこのループから抜け出せるのか？」現役の学習者である私が、
                  自分自身が本当に欲しいと思えるツールを作りました。
                </blockquote>
              </FadeUp>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: Solution
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <ScrollSection>
            <FadeUp className="text-center mb-10 sm:mb-14">
              <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-3">
                ✦ Our Approach
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.45] text-slate-900">
                丸暗記を捨てて、
                <br />
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  「コアイメージ」を掴む。
                </span>
              </h2>
            </FadeUp>

            {/* Diagram */}
            <FadeUp className="flex flex-row items-stretch justify-center gap-4 mb-10 sm:mb-14">
              {/* 丸暗記 NG */}
              <div className="relative flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl border border-red-200 bg-red-50 w-36 sm:w-44 text-center shrink-0">
                <span className="text-3xl select-none">📖</span>
                <p className="text-sm font-bold text-slate-700">丸暗記</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">1,000個のイディオムを記憶する</p>
                {/* X mark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl overflow-hidden">
                  <div className="w-[130%] h-px bg-red-400/60" style={{ transform: "rotate(18deg)" }} />
                  <div className="absolute w-[130%] h-px bg-red-400/60" style={{ transform: "rotate(-18deg)" }} />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
              </div>

              {/* LinguistLens */}
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl border border-indigo-200 bg-indigo-50 w-36 sm:w-44 text-center shadow-[0_4px_20px_rgba(99,102,241,0.12)] shrink-0">
                <Brain className="w-8 h-8 text-indigo-600" />
                <p className="text-sm font-bold text-indigo-900">コアイメージ</p>
                <p className="text-[11px] text-indigo-600 leading-relaxed">本質理解 × 無限の表現力</p>
              </div>
            </FadeUp>

            <FadeUp>
              <div className="max-w-2xl mx-auto space-y-4 text-slate-600 leading-relaxed text-center">
                <p>
                  ネイティブが日常会話で使うのは、実はとてもシンプルな基本動詞（make, get, take等）や
                  前置詞（on, off, up等）の組み合わせです。
                </p>
                <p>
                  すべてのイディオムを暗記するのは無謀です。LinguistLensは、
                  日本語訳の暗記ではなく、単語が持つ
                  <strong className="text-slate-900"> 「コアイメージ（本質的な意味）」 </strong>
                  の理解をサポートし、最小限の暗記で無限の表現力を引き出します。
                </p>
              </div>
            </FadeUp>
          </ScrollSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: How to Use
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <ScrollSection>
            <FadeUp className="text-center mb-8 sm:mb-12">
              <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-3">
                ✦ Learning Loop
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.45]">
                好きなコンテンツから、
                <br />
                生きた英語を吸収するループ
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StepCard
                step="STEP 1"
                icon={Youtube}
                title="好きな動画でインプット"
                description="退屈な教科書は不要です。好きなYouTuberや海外記事のURLを入れるだけ。AIがあなたのレベルに合った実用的な表現だけを抽出します。"
              />
              <StepCard
                step="STEP 2"
                icon={BookMarked}
                title="コアイメージで理解・保存"
                description="抽出された表現を、ニュアンス解説とともにマイページに保存。丸暗記ではなく感覚で理解します。"
              />
              <StepCard
                step="STEP 3"
                icon={Zap}
                title="アウトプットと再構築"
                description="保存した表現を繰り返し口に出して定着。覚えた表現を組み込んだ「自分専用のAI記事」を生成して多読し、確実に「使える英語」へ昇華させます。"
              />
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6: Pricing
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-24 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <ScrollSection>
            <FadeUp className="text-center mb-10 sm:mb-14">
              <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-3">
                ✦ Pricing
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                シンプルで透明なプライシング
              </h2>
              <p className="text-slate-500 text-sm mt-3">
                まず無料で体験して、気に入ったらアップグレード。
              </p>
            </FadeUp>

            <FadeUp>
              <PricingPlanComparison />
            </FadeUp>
          </ScrollSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7: CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-28 px-6 border-t border-slate-100 relative overflow-hidden bg-slate-50">
        {/* Subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <ScrollSection className="relative z-10 text-center max-w-2xl mx-auto">
          <FadeUp>
            <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-4">
              ✦ Get Started Free
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.45] mb-4 sm:mb-5 text-slate-900">
              「知っている」から
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                「使える」
              </span>
              へ。
            </h2>
            <p className="text-slate-600 leading-relaxed mb-2">
              今日から、あなた専用の英語学習をはじめましょう。
            </p>
            <p className="text-slate-400 text-sm mb-8 sm:mb-12">
              ※ 無料枠はアカウント登録後、累計3回までご利用いただけます
            </p>
          </FadeUp>

          <FadeUp>
            <button
              onClick={() => openSignIn()}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-lg shadow-sm hover:shadow-[0_4px_30px_rgba(99,102,241,0.45)] transition-all duration-300 active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              無料でLinguistLensをはじめる
              <ArrowRight className="w-5 h-5" />
            </button>
          </FadeUp>
        </ScrollSection>
      </section>

    </div>
  );
}
