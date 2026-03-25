import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";

export const metadata: Metadata = {
  title: "利用規約",
  description: "LinguistLens の利用規約です。",
};

const LAST_UPDATED = "2026年3月24日";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="3xl" right={<GlobalNav />} />

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-2">
            Legal
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            利用規約
          </h1>
          <p className="text-sm text-slate-400">最終更新日：{LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate prose-sm sm:prose-base max-w-none space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第1条　適用範囲
            </h2>
            <p className="text-slate-600 leading-relaxed">
              本利用規約（以下「本規約」）は、LinguistLens（以下「本サービス」）の利用条件を定めるものです。
              本サービスを利用するすべての方（以下「ユーザー」）は、本規約に同意の上でご利用ください。
              本サービスにアクセスまたは利用した時点で、本規約に同意したものとみなします。
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第2条　サービスの概要
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              本サービスは、YouTubeの動画URLやWeb記事のURLを入力することで、AIが英語フレーズ・表現を自動抽出し、
              日本人英語学習者向けに解説・翻訳を提供する英語学習支援ツールです。
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
              <li>一部機能はアカウント登録なしで無料利用できます。</li>
              <li>より高度な機能はアカウント登録または有料プランが必要な場合があります。</li>
              <li>サービスの内容・機能は予告なく変更・終了する場合があります。</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第3条　外部APIの利用について
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              本サービスは、コンテンツの解析・翻訳・フレーズ抽出のため、以下の外部APIサービスを利用しています。
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
              <li>
                <strong>Anthropic Claude API</strong>：AIによるフレーズ抽出・解説・記事生成に使用。
                入力されたテキストや字幕データがAnthropicのサーバーへ送信されます。
              </li>
              <li>
                <strong>Supadata API</strong>：YouTubeの字幕データ取得に使用。
                入力されたYouTube動画IDがSupadataのサーバーへ送信されます。
              </li>
              <li>
                <strong>Clerk</strong>：ユーザー認証・アカウント管理に使用。
              </li>
              <li>
                <strong>Supabase</strong>：データベースとして利用（保存された解析結果等）。
              </li>
            </ul>
            <p className="text-slate-500 text-sm mt-3">
              各外部サービスの利用規約・プライバシーポリシーについては、各サービス提供者のウェブサイトをご確認ください。
              ユーザーが入力したコンテンツは、上記外部サービスの処理方針に従って取り扱われます。
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第4条　免責事項
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-4">
              <p className="text-amber-800 text-sm font-semibold mb-1">精度に関する重要なお知らせ</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                本サービスが提供するフレーズ抽出・翻訳・解説・記事生成等のすべてのAI生成コンテンツは、
                その正確性・完全性・有用性を100%保証するものではありません。
                英語学習の補助ツールとしてご活用いただき、重要な判断には必ず一次情報をご確認ください。
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
              <li>AIによるフレーズ抽出・翻訳には誤りが含まれる場合があります。</li>
              <li>字幕の取得・解析結果は動画・記事の内容によって品質が異なります。</li>
              <li>
                本サービスの利用によって生じたいかなる損害（学習効果・試験結果・業務上の損失等を含む）
                についても、運営者は一切の責任を負いません。
              </li>
              <li>
                サービスの中断・停止・データの消失等によって生じた損害について、
                運営者は一切の責任を負いません。
              </li>
              <li>
                YouTube等の外部サービスの仕様変更により、字幕取得機能が利用できなくなる場合があります。
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第5条　禁止事項
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              ユーザーは、以下の行為を行ってはなりません。
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-sm">
              <li>本サービスへの不正アクセスまたはその試み</li>
              <li>本サービスのAPI・機能への過度な負荷をかける行為（スクレイピング等）</li>
              <li>著作権その他の知的財産権を侵害するコンテンツの入力・送信</li>
              <li>違法・有害・わいせつなコンテンツの入力・送信</li>
              <li>本サービスの運営を妨害する一切の行為</li>
              <li>本サービスを通じて得られたコンテンツの無断転載・商業利用</li>
              <li>その他、法令または公序良俗に反する行為</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第6条　知的財産権
            </h2>
            <p className="text-slate-600 leading-relaxed">
              本サービスのUI・デザイン・システム・ロゴ等に関する知的財産権は運営者に帰属します。
              本サービスを通じてAIが生成した記事・解説等のコンテンツは、個人的な学習目的での利用に限ります。
              商業目的での無断転用・再配布は禁止します。
              なお、入力されたYouTube字幕・Web記事の著作権は各コンテンツの権利者に帰属します。
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第7条　規約の変更
            </h2>
            <p className="text-slate-600 leading-relaxed">
              運営者は、必要に応じて本規約を変更できるものとします。変更後の規約はサービス上に掲載した時点で効力を生じ、
              その後にサービスを利用したユーザーは変更後の規約に同意したものとみなします。
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第8条　準拠法・管轄
            </h2>
            <p className="text-slate-600 leading-relaxed">
              本規約は日本法に準拠します。本サービスに関して紛争が生じた場合は、
              運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-indigo-500 hover:text-indigo-700 transition-colors">
            ← トップページへ戻る
          </Link>
          <Link href="/privacy" className="text-indigo-500 hover:text-indigo-700 transition-colors">
            プライバシーポリシーを読む →
          </Link>
        </div>
      </main>
    </div>
  );
}
