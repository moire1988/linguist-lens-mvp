export type VideoCategory = "TED" | "Speech" | "Vlog" | "News" | "Podcast";

export interface RecommendedVideoCard {
  slug: string;
  title: string;
  sublabel: string;
  /** Primary CEFR level shown as badge (e.g. "B2") */
  level: string;
  /** Range displayed on card (e.g. "B1 〜 B2") */
  cefrRange: string;
  category: VideoCategory;
  /** YouTube video ID — used for thumbnail via img.youtube.com */
  youtubeId: string;
  /**
   * true = 解析ページ作成済み → /examples/${slug} にリンク
   * false = 準備中 → リンク不可・Coming Soon 表示
   */
  ready: boolean;
}

export const RECOMMENDED_VIDEOS: RecommendedVideoCard[] = [
  // ── 解析ページ作成済み ────────────────────────────────────────────────────
  {
    slug: "emma-watson-un",
    title: "Emma Watson · HeForShe UN Speech",
    sublabel: "国連 · 2014",
    level: "B1",
    cefrRange: "A2 〜 B1",
    category: "Speech",
    youtubeId: "gkjW9PZBRfk",
    ready: true,
  },
  {
    slug: "jobs-stanford",
    title: "Steve Jobs · Stanford Commencement",
    sublabel: "Stanford · 2005",
    level: "C1",
    cefrRange: "B2 〜 C1",
    category: "Speech",
    youtubeId: "UF8uR6Z6KLc",
    ready: true,
  },
  {
    slug: "simon-sinek-ted",
    title: "Simon Sinek · How Great Leaders Inspire",
    sublabel: "TED · 2010",
    level: "B2",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "qp0HIF3SfI4",
    ready: true,
  },

  // ── 準備中（slug・サムネイルのみ確保、後で ready: true に変更） ─────────────
  {
    slug: "brene-brown-ted",
    title: "Brené Brown · The Power of Vulnerability",
    sublabel: "TED · 2010",
    level: "B2",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "iCvmsMzlF7o",
    ready: false,
  },
  {
    slug: "ali-abdaal-productivity",
    title: "Ali Abdaal · How I Manage My Time",
    sublabel: "Vlog · Productivity",
    level: "B1",
    cefrRange: "A2 〜 B1",
    category: "Vlog",
    youtubeId: "hER0Qp6QJNU",
    ready: false,
  },
  {
    slug: "bbc-news-climate",
    title: "BBC News · Climate Change Explained",
    sublabel: "News · Environment",
    level: "B2",
    cefrRange: "B2 〜 C1",
    category: "News",
    youtubeId: "G4H1N_yXBiA",
    ready: false,
  },

  // ── プレースホルダー（後で本データに差し替えてください） ──────────────────────
  { slug: "", title: "", sublabel: "", level: "B1", cefrRange: "", category: "TED",     youtubeId: "", ready: false },
  { slug: "", title: "", sublabel: "", level: "B2", cefrRange: "", category: "Vlog",    youtubeId: "", ready: false },
  { slug: "", title: "", sublabel: "", level: "C1", cefrRange: "", category: "News",    youtubeId: "", ready: false },
];
