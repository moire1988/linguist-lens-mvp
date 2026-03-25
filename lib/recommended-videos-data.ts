import { extractYouTubeVideoId } from "@/lib/youtube-url";

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
  /**
   * トップで「おすすめURL」として入力されたときのフェイク解析後の遷移先。
   * 未指定時は `/examples/${slug}`。
   */
  targetPath?: string;
}

/**
 * 入力 URL が RECOMMENDED_VIDEOS のいずれか（ready かつ YouTube ID 一致）と一致する場合、
 * 遷移先パスを返す。一致しなければ null。
 */
export function getRecommendedVideoTargetPathByUrl(url: string): string | null {
  const id = extractYouTubeVideoId(url.trim());
  if (!id) return null;
  const card = RECOMMENDED_VIDEOS.find((v) => v.youtubeId === id && v.ready);
  if (!card) return null;
  const custom = card.targetPath?.trim();
  if (custom) return custom;
  return `/examples/${card.slug}`;
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
  // A1
  {
    slug: "matt-cutts-ted",
    title: "Matt Cutts · Try Something New for 30 Days",
    sublabel: "TED · 2011",
    level: "A1",
    cefrRange: "A1 〜 A2",
    category: "TED",
    youtubeId: "JnfBXjWm7hc",
    ready: true,
  },
  {
    slug: "malala-un-2013",
    title: "Malala Yousafzai · UN Speech",
    sublabel: "国連 · 2013",
    level: "A1",
    cefrRange: "A1 〜 A2",
    category: "Speech",
    youtubeId: "3rNhZu3ttIU",
    ready: true,
  },
  // A2
  {
    slug: "mcgonigal-stress-ted",
    title: "Kelly McGonigal · How to Make Stress Your Friend",
    sublabel: "TED · 2013",
    level: "A2",
    cefrRange: "A2 〜 B1",
    category: "TED",
    youtubeId: "RcGyVTAoXEU",
    ready: true,
  },
  {
    slug: "achor-happy-ted",
    title: "Shawn Achor · The Happy Secret to Better Work",
    sublabel: "TED · 2011",
    level: "A2",
    cefrRange: "A2 〜 B1",
    category: "TED",
    youtubeId: "GXy__kBVq1M",
    ready: true,
  },
  // B1
  {
    slug: "robinson-schools-ted",
    title: "Ken Robinson · Do Schools Kill Creativity?",
    sublabel: "TED · 2006",
    level: "B1",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "iG9CE55wbtY",
    ready: true,
  },
  {
    slug: "brene-brown-ted",
    title: "Brené Brown · The Power of Vulnerability",
    sublabel: "TED · 2010",
    level: "B1",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "iCvmsMzlF7o",
    ready: true,
  },
  {
    slug: "cuddy-body-language-ted",
    title: "Amy Cuddy · Your Body Language May Shape Who You Are",
    sublabel: "TED · 2012",
    level: "B1",
    cefrRange: "A2 〜 B1",
    category: "TED",
    youtubeId: "Ks-_Mh1QhMc",
    ready: true,
  },
  {
    slug: "gilbert-genius-ted",
    title: "Elizabeth Gilbert · Your Elusive Creative Genius",
    sublabel: "TED · 2009",
    level: "B1",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "86x-u-tz0MA",
    ready: true,
  },
  // B2
  {
    slug: "adichie-single-story-ted",
    title: "Chimamanda Adichie · The Danger of a Single Story",
    sublabel: "TED · 2009",
    level: "B2",
    cefrRange: "B1 〜 B2",
    category: "TED",
    youtubeId: "D9Ihs241zeg",
    ready: true,
  },
  {
    slug: "rowling-harvard-2008",
    title: "J.K. Rowling · Harvard Commencement Speech",
    sublabel: "Harvard · 2008",
    level: "B2",
    cefrRange: "B2 〜 C1",
    category: "Speech",
    youtubeId: "wHGqp8lz36c",
    ready: true,
  },
  {
    slug: "michelle-obama-dnc-2016",
    title: "Michelle Obama · DNC Keynote Speech",
    sublabel: "DNC · 2016",
    level: "B2",
    cefrRange: "B1 〜 B2",
    category: "Speech",
    youtubeId: "4ZNWYqDU948",
    ready: true,
  },
  {
    slug: "pausch-last-lecture",
    title: "Randy Pausch · The Last Lecture",
    sublabel: "Carnegie Mellon · 2007",
    level: "B2",
    cefrRange: "B2 〜 C1",
    category: "Speech",
    youtubeId: "ji5_MqicxSo",
    ready: true,
  },
  // C1
  {
    slug: "obama-farewell-2017",
    title: "Barack Obama · Farewell Address",
    sublabel: "Chicago · 2017",
    level: "C1",
    cefrRange: "C1 〜 C2",
    category: "Speech",
    youtubeId: "-ttWOx4hg48",
    ready: true,
  },
  {
    slug: "musk-usc-2014",
    title: "Elon Musk · USC Commencement Speech",
    sublabel: "USC · 2014",
    level: "C1",
    cefrRange: "B2 〜 C1",
    category: "Speech",
    youtubeId: "e5AwNU3Y2es",
    ready: true,
  },
  {
    slug: "oprah-stanford-2008",
    title: "Oprah Winfrey · Stanford Commencement Speech",
    sublabel: "Stanford · 2008",
    level: "C1",
    cefrRange: "B2 〜 C1",
    category: "Speech",
    youtubeId: "fgCCFnuEnfM",
    ready: true,
  },
  // C2
  {
    slug: "dfw-this-is-water",
    title: "David Foster Wallace · This is Water",
    sublabel: "Kenyon · 2005",
    level: "C2",
    cefrRange: "C1 〜 C2",
    category: "Speech",
    youtubeId: "8CrOL-ydFMI",
    ready: true,
  },
  {
    slug: "sagan-pale-blue-dot",
    title: "Carl Sagan · Pale Blue Dot",
    sublabel: "NASA · 1990",
    level: "C2",
    cefrRange: "C1 〜 C2",
    category: "Speech",
    youtubeId: "wupToqz1e2g",
    ready: true,
  },
];
