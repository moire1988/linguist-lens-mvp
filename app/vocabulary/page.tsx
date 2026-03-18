"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Trash2,
  Download,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Eye,
  EyeOff,
  BookMarked,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getVocabulary,
  deletePhrase,
  clearAll,
  exportToCSV,
  type SavedPhrase,
} from "@/lib/vocabulary";
import { AdPlaceholder } from "@/components/ad-placeholder";

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  phrasal_verb: { label: "句動詞", color: "bg-violet-100 text-violet-700 border-violet-200" },
  idiom: { label: "イディオム", color: "bg-amber-100 text-amber-700 border-amber-200" },
  collocation: { label: "コロケーション", color: "bg-sky-100 text-sky-700 border-sky-200" },
  grammar_pattern: { label: "文法パターン", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600",
  A2: "bg-green-100 text-green-700",
  B1: "bg-blue-100 text-blue-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700",
  C2: "bg-rose-100 text-rose-700",
};

// ─── Flashcard Component ───────────────────────────────────────────────────

function FlashCard({
  cards,
  onExit,
}: {
  cards: SavedPhrase[];
  onExit: () => void;
}) {
  const [deck, setDeck] = useState<SavedPhrase[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ known: 0, unknown: 0 });
  const [finished, setFinished] = useState(false);

  // Shuffle on mount
  useEffect(() => {
    setDeck([...cards].sort(() => Math.random() - 0.5));
  }, [cards]);

  const current = deck[index];
  const progress = deck.length > 0 ? ((index) / deck.length) * 100 : 0;

  const handleSpeak = useCallback(() => {
    if (!current || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(current.expression);
    u.lang = "en-US";
    u.rate = 0.82;
    window.speechSynthesis.speak(u);
  }, [current]);

  const next = useCallback(
    (knew: boolean) => {
      setScore((s) => ({
        known: s.known + (knew ? 1 : 0),
        unknown: s.unknown + (knew ? 0 : 1),
      }));
      if (index + 1 >= deck.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setRevealed(false);
      }
    },
    [index, deck.length]
  );

  const restart = useCallback(() => {
    setDeck((d) => [...d].sort(() => Math.random() - 0.5));
    setIndex(0);
    setRevealed(false);
    setScore({ known: 0, unknown: 0 });
    setFinished(false);
  }, []);

  if (!current && !finished) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-500">
              フラッシュカード
            </span>
            <button
              onClick={onExit}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 text-right">
            {index} / {deck.length}
          </p>
        </div>

        {/* Finished screen */}
        {finished ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">
              {score.known >= deck.length * 0.8 ? "🎉" : "💪"}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              完了！
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              覚えた: {score.known}語 ／ もう少し: {score.unknown}語
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={restart}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Shuffle className="h-4 w-4" />
                もう一度
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                単語帳に戻る
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6">
            {/* Card front */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                    TYPE_CONFIG[current.type]?.color ?? "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  {TYPE_CONFIG[current.type]?.label ?? current.type}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-full",
                    CEFR_COLORS[current.cefr_level] ?? "bg-slate-100 text-slate-600"
                  )}
                >
                  {current.cefr_level}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {current.expression}
                </h2>
                <button
                  onClick={handleSpeak}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400">この表現の意味は？</p>
            </div>

            {/* Reveal section */}
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <Eye className="h-4 w-4" />
                意味を確認する
              </button>
            ) : (
              <div>
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    意味
                  </p>
                  <p className="text-base font-semibold text-slate-800 mb-3">
                    {current.meaning_ja}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    例文
                  </p>
                  <p className="text-sm text-indigo-700 font-medium">
                    {current.example}
                  </p>
                </div>

                {/* Answer buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => next(false)}
                    className="py-3 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-600 font-semibold text-sm hover:bg-rose-100 transition-colors"
                  >
                    😔 もう少し
                  </button>
                  <button
                    onClick={() => next(true)}
                    className="py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors"
                  >
                    😊 覚えた！
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => { setIndex((i) => Math.max(0, i - 1)); setRevealed(false); }}
                disabled={index === 0}
                className="flex items-center gap-1 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                前へ
              </button>
              <button
                onClick={() => { setIndex((i) => Math.min(deck.length - 1, i + 1)); setRevealed(false); }}
                disabled={index >= deck.length - 1}
                className="flex items-center gap-1 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-600 transition-colors"
              >
                次へ
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<SavedPhrase[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cefrFilter, setCefrFilter] = useState<string>("all");
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setVocabulary(getVocabulary());
  }, []);

  // Filtered vocabulary
  const filtered = useMemo(() => {
    return vocabulary.filter((p) => {
      const matchSearch =
        search === "" ||
        p.expression.toLowerCase().includes(search.toLowerCase()) ||
        p.meaning_ja.includes(search);
      const matchType = typeFilter === "all" || p.type === typeFilter;
      const matchCefr = cefrFilter === "all" || p.cefr_level === cefrFilter;
      return matchSearch && matchType && matchCefr;
    });
  }, [vocabulary, search, typeFilter, cefrFilter]);

  // Available filter options (only show types/levels that exist in data)
  const availableTypes = useMemo(
    () => Array.from(new Set(vocabulary.map((p) => p.type))),
    [vocabulary]
  );
  const availableCefr = useMemo(
    () => ["A1","A2","B1","B2","C1","C2"].filter((l) => vocabulary.some((p) => p.cefr_level === l)),
    [vocabulary]
  );

  const handleDelete = useCallback((id: string, expression: string) => {
    setVocabulary(deletePhrase(id));
    toast.success(`「${expression}」を削除しました`);
  }, []);

  const handleClearAll = useCallback(() => {
    clearAll();
    setVocabulary([]);
    setShowClearConfirm(false);
    toast.success("単語帳をすべて削除しました");
  }, []);

  const handleExportCSV = useCallback(() => {
    if (vocabulary.length === 0) {
      toast.error("保存された表現がありません");
      return;
    }
    exportToCSV(vocabulary);
    toast.success("CSVをダウンロードしました");
  }, [vocabulary]);

  const handleSpeak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50/50">
      {/* Flashcard overlay */}
      {showFlashcard && vocabulary.length > 0 && (
        <FlashCard
          cards={filtered.length > 0 ? filtered : vocabulary}
          onExit={() => setShowFlashcard(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span className="font-bold text-slate-800 tracking-tight">LinguistLens</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              ← 解析に戻る
            </Link>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
              <BookMarked className="h-3 w-3 inline mr-1" />
              {vocabulary.length}語
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page title + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              マイ単語帳
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {vocabulary.length > 0
                ? `${vocabulary.length}個の表現を保存中`
                : "保存した表現がここに表示されます"}
            </p>
          </div>

          {vocabulary.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowFlashcard(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Eye className="h-4 w-4" />
                フラッシュカード
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-500 rounded-xl text-sm font-medium text-slate-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                全削除
              </button>
            </div>
          )}
        </div>

        {/* Ad placeholder — top */}
        {vocabulary.length > 0 && (
          <AdPlaceholder slot="単語帳トップ · 728×90" className="mb-6" size="sm" />
        )}

        {/* Empty state */}
        {vocabulary.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📖</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              まだ単語が保存されていません
            </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
              解析結果のカードにある「単語帳に保存」ボタンを押すと、ここに表示されます。
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              解析を始める →
            </Link>
          </div>
        )}

        {/* Search + Filters */}
        {vocabulary.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="表現・意味で検索..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Type filter */}
            {availableTypes.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    typeFilter === "all"
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  すべて
                </button>
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      typeFilter === type
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {TYPE_CONFIG[type]?.label ?? type}
                  </button>
                ))}
              </div>
            )}

            {/* CEFR filter */}
            {availableCefr.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setCefrFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    cefrFilter === "all"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  全レベル
                </button>
                {availableCefr.map((level) => (
                  <button
                    key={level}
                    onClick={() => setCefrFilter(level)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                      cefrFilter === level
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}

            {/* Result count */}
            {(search || typeFilter !== "all" || cefrFilter !== "all") && (
              <p className="text-xs text-slate-400 mb-4">
                {filtered.length}件 表示中
              </p>
            )}

            {/* Cards */}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                条件に一致する表現が見つかりませんでした
              </div>
            )}

            <div className="space-y-3">
              {filtered.map((phrase, i) => (
                <>
                  {/* Ad placeholder every 8 items */}
                  {i > 0 && i % 8 === 0 && (
                    <AdPlaceholder
                      key={`ad-${i}`}
                      slot={`インフィード広告 · 336×280`}
                      size="md"
                    />
                  )}
                  <div
                    key={phrase.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded-full border",
                              TYPE_CONFIG[phrase.type]?.color ??
                                "bg-slate-100 text-slate-600 border-slate-200"
                            )}
                          >
                            {TYPE_CONFIG[phrase.type]?.label ?? phrase.type}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              CEFR_COLORS[phrase.cefr_level] ??
                                "bg-slate-100 text-slate-600"
                            )}
                          >
                            {phrase.cefr_level}
                          </span>
                          <span className="text-[10px] text-slate-300 ml-auto hidden sm:block">
                            {new Date(phrase.savedAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {phrase.expression}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                          {phrase.meaning_ja}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleSpeak(phrase.expression)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="発音を聞く"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(phrase.id, phrase.expression)}
                          className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Example (collapsible detail) */}
                    <div className="mt-3 bg-indigo-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                        {phrase.example}
                      </p>
                    </div>
                  </div>
                </>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
              <h3 className="font-bold text-slate-800">単語帳をすべて削除</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              {vocabulary.length}個の表現がすべて削除されます。この操作は元に戻せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-100 py-6 mt-8">
        <p className="text-center text-xs text-slate-400">
          © 2024 LinguistLens · データはこのブラウザにのみ保存されます
        </p>
      </footer>
    </div>
  );
}
