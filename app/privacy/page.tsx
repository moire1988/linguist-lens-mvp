import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "LinguistLens のプライバシーポリシーです。",
};

const LAST_UPDATED = "2026年3月24日";

export default function PrivacyPage() {
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
            プライバシーポリシー
          </h1>
          <p className="text-sm text-slate-400">最終更新日：{LAST_UPDATED}</p>
        </div>

        <div className="prose prose-slate prose-sm sm:prose-base max-w-none space-y-10">

          {/* 1 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第1条　基本方針
            </h2>
            <p className="text-slate-600 leading-relaxed">
              LinguistLens（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
              本プライバシーポリシーは、本サービスが収集する情報の種類、利用目的、
              および第三者への提供方針について説明するものです。
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第2条　収集する情報
            </h2>

            <h3 className="text-sm font-semibold text-slate-700 mb-2">（1）アカウント情報</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              アカウント登録をご利用の場合、認証サービス（Clerk）を通じて以下の情報を取得します。
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm mb-5">
              <li>メールアドレス</li>
              <li>ユーザーID（認証システムが自動生成）</li>
              <li>Googleアカウント等のOAuth連携情報（連携した場合）</li>
            </ul>

            <h3 className="text-sm font-semibold text-slate-700 mb-2">（2）利用データ</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm mb-5">
              <li>入力されたYouTube URL・Web記事URL</li>
              <li>選択した学習レベル（CEFR）・アクセントの設定</li>
              <li>解析結果（フレーズ・翻訳・解説等）の保存データ</li>
              <li>マイページに保存した表現データ</li>
            </ul>

            <h3 className="text-sm font-semibold text-slate-700 mb-2">（3）アクセスログ・技術情報</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
              <li>IPアドレス（ハッシュ化して保存。利用制限管理のみに使用）</li>
              <li>ブラウザの種類・OSの種類（アクセス解析ツール経由）</li>
              <li>アクセス日時・参照ページ</li>
              <li>Cookieおよびローカルストレージ（設定の保存・利用回数管理）</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第3条　情報の利用目的
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-sm">
              <li>本サービスの提供・機能の実現（フレーズ抽出・解析・保存等）</li>
              <li>ユーザーアカウントの管理・認証</li>
              <li>利用制限（1日あたりの解析回数制限）の管理</li>
              <li>サービスの改善・不具合対応・新機能開発</li>
              <li>不正利用の防止・セキュリティの確保</li>
              <li>サービスに関する重要なお知らせの配信</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第4条　外部サービスへの情報送信
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              本サービスは以下の外部サービスを利用しており、入力データの一部が各サービスのサーバーへ送信されます。
            </p>
            <div className="space-y-3">
              {[
                {
                  name: "Anthropic（Claude API）",
                  desc: "フレーズ抽出・翻訳・解説・記事生成のため、URLから取得した字幕・記事テキストを送信します。",
                  url: "https://www.anthropic.com/privacy",
                },
                {
                  name: "Supadata",
                  desc: "YouTube字幕の取得のため、動画IDを送信します。",
                  url: "https://supadata.ai",
                },
                {
                  name: "Clerk",
                  desc: "ユーザー認証・アカウント管理のため、メールアドレス等の認証情報を送信します。",
                  url: "https://clerk.com/privacy",
                },
                {
                  name: "Supabase",
                  desc: "解析結果・マイページの保存データ等のため、データをSupabaseのデータベースに格納します。",
                  url: "https://supabase.com/privacy",
                },
                {
                  name: "Vercel / Google Analytics / GTM",
                  desc: "ホスティングおよびアクセス解析のため、アクセスログ・技術情報を送信します。",
                  url: "https://vercel.com/legal/privacy-policy",
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-700 mb-0.5">{s.name}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              各外部サービスの個人情報の取り扱いについては、各サービスのプライバシーポリシーをご参照ください。
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第5条　第三者への情報提供
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-sm">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づき開示が求められた場合</li>
              <li>人の生命・身体・財産を保護するために必要な場合</li>
              <li>
                サービス提供のために必要な業務委託先（前条に記載の外部サービス）への提供
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第6条　Cookieおよびローカルストレージの利用
            </h2>
            <p className="text-slate-600 leading-relaxed mb-3">
              本サービスは以下の目的でCookieおよびブラウザのローカルストレージを使用します。
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-sm">
              <li>学習レベル・アクセント設定の保存（ローカルストレージ）</li>
              <li>ゲストユーザーの1日あたり利用回数の管理（Cookie）</li>
              <li>ログインセッションの維持（認証サービスCookieによる）</li>
              <li>アクセス解析ツール（Google Analytics等）のCookie</li>
            </ul>
            <p className="text-slate-500 text-sm mt-3">
              ブラウザの設定によりCookieを無効化することができますが、一部機能が制限される場合があります。
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第7条　データの保持期間と削除
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-sm">
              <li>解析結果・マイページの保存データ：アカウント削除まで保持</li>
              <li>利用制限管理データ（IPハッシュ等）：当日分のみ保持し、翌日以降に自動削除</li>
              <li>アクセスログ：最大90日間保持</li>
            </ul>
            <p className="text-slate-500 text-sm mt-3">
              アカウントの削除をご希望の場合は、設定画面またはお問い合わせよりお申し付けください。
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第8条　未成年者の利用
            </h2>
            <p className="text-slate-600 leading-relaxed">
              本サービスは13歳未満のお子様を対象としていません。
              13歳未満の方が誤って個人情報を提供していることが判明した場合、
              速やかに当該情報を削除します。
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第9条　プライバシーポリシーの変更
            </h2>
            <p className="text-slate-600 leading-relaxed">
              運営者は、法令の変更またはサービス内容の変更に伴い、
              本ポリシーを予告なく変更する場合があります。
              変更後のポリシーはサービス上に掲載した時点で効力を生じます。
              重要な変更がある場合は、可能な範囲でサービス内にてお知らせします。
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">
              第10条　お問い合わせ
            </h2>
            <p className="text-slate-600 leading-relaxed">
              個人情報の取り扱いに関するお問い合わせは、本サービス内のフィードバック機能よりご連絡ください。
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-indigo-500 hover:text-indigo-700 transition-colors">
            ← トップページへ戻る
          </Link>
          <Link href="/terms" className="text-indigo-500 hover:text-indigo-700 transition-colors">
            利用規約を読む →
          </Link>
        </div>
      </main>
    </div>
  );
}
