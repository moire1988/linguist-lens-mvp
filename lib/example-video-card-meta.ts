import type { ExampleVideo } from "@/lib/examples-data";
import {
  RECOMMENDED_VIDEOS,
  type VideoCategory,
} from "@/lib/recommended-videos-data";

/**
 * トップのおすすめカード（RECOMMENDED_VIDEOS）と同じ level / category / cefrRange を優先。
 * 未登録のサンプルは overallLevel・cefrRange とヒューリスティックなカテゴリ。
 */
export function getExampleVideoCardMeta(ex: ExampleVideo): {
  level: string;
  category: VideoCategory;
  cefrRange: string;
} {
  const rec = RECOMMENDED_VIDEOS.find((v) => v.slug === ex.slug && v.ready);
  if (rec) {
    return {
      level: rec.level,
      category: rec.category,
      cefrRange: rec.cefrRange,
    };
  }
  return {
    level: ex.overallLevel,
    category: inferVideoCategory(ex),
    cefrRange: ex.cefrRange,
  };
}

function inferVideoCategory(ex: ExampleVideo): VideoCategory {
  const t = `${ex.sublabel} ${ex.title}`.toLowerCase();
  if (t.includes("ted")) return "TED";
  if (t.includes("podcast")) return "Podcast";
  if (t.includes("vlog")) return "Vlog";
  if (t.includes("news") || t.includes("cnn") || t.includes("bbc")) {
    return "News";
  }
  return "Speech";
}
