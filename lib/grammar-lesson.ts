import type {
  CoreConcept,
  VerbPairExample,
  VerbPair,
  GrammarSection,
  PracticeItem,
  GrammarLesson,
} from "@/data/grammar-lessons";
import { GRAMMAR_LESSONS } from "@/data/grammar-lessons";

export type {
  CoreConcept,
  VerbPairExample,
  VerbPair,
  GrammarSection,
  PracticeItem,
  GrammarLesson,
};
export { GRAMMAR_LESSONS };

/** slug からレッスンを取得。見つからない場合は undefined */
export function getGrammarLesson(slug: string): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find((l) => l.slug === slug);
}

/** `generateStaticParams` 用：全スラッグ一覧 */
export function getAllGrammarSlugs(): string[] {
  return GRAMMAR_LESSONS.map((l) => l.slug);
}
