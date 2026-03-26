/**
 * 記事タイトル表示（DB: title_ja = メイン見出し、title_en = 英語サブ）
 */
export function articleDisplayTitles(article: {
  titleEn: string;
  titleJa?: string | null;
}): { primary: string; secondary: string | undefined } {
  const ja = article.titleJa?.trim();
  const en = article.titleEn?.trim() ?? "";
  if (ja) {
    return { primary: ja, secondary: en || undefined };
  }
  return { primary: en, secondary: undefined };
}
