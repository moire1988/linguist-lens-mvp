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
}

export const RECOMMENDED_VIDEOS: RecommendedVideoCard[] = [
  // ── 既存ページあり ────────────────────────────────────────────────────────
  {
    slug: "emma-watson-un",
    title: "Emma Watson · HeForShe UN Speech",
    sublabel: "国連 · 2014",
    level: "B1",
    cefrRange: "A2 〜 B1",
    category: "Speech",
    youtubeId: "gkjW9PZBRfk",
  },
  {
    slug: "jobs-stanford",
    title: "Steve Jobs · Stanford Commencement",
    sublabel: "Stanford · 2005",
    level: "C1",
    cefrRange: "B2 〜 C1",
    category: "Speech",
    youtubeId: "UF8uR6Z6KLc",
  },
  {
    slug: "simon-sinek-ted",
    title: "Simon Sinek · How Great Leaders Inspire",
    sublabel: "TED · 2010",
    level: "B2",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "qp0HIF3SfI4",
  },

  // ── 追加予定（後で本データに差し替えてください） ───────────────────────────
  {
    slug: "brene-brown-ted",
    title: "Brené Brown · The Power of Vulnerability",
    sublabel: "TED · 2010",
    level: "B2",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "iCvmsMzlF7o",
  },
  {
    slug: "ali-abdaal-productivity",
    title: "Ali Abdaal · How I Manage My Time",
    sublabel: "Vlog · Productivity",
    level: "B1",
    cefrRange: "A2 〜 B1",
    category: "Vlog",
    youtubeId: "hER0Qp6QJNU",
  },
  {
    slug: "bbc-news-climate",
    title: "BBC News · Climate Change Explained",
    sublabel: "News · Environment",
    level: "B2",
    cefrRange: "B2 〜 C1",
    category: "News",
    youtubeId: "G4H1N_yXBiA",
  },

  // ── プレースホルダー（後で差し替えてください） ───────────────────────────────
  {
    slug: "",
    title: "Coming Soon",
    sublabel: "",
    level: "B1",
    cefrRange: "B1",
    category: "TED",
    youtubeId: "",
  },
  {
    slug: "",
    title: "Coming Soon",
    sublabel: "",
    level: "B2",
    cefrRange: "B2",
    category: "Vlog",
    youtubeId: "",
  },
  {
    slug: "",
    title: "Coming Soon",
    sublabel: "",
    level: "C1",
    cefrRange: "C1",
    category: "News",
    youtubeId: "",
  },
];
