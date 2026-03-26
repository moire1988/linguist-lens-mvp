import { auth } from "@clerk/nextjs/server";
import { getUserVocabularyAction } from "@/app/actions/vocabulary";
import { VocabularyPageClient } from "./vocabulary-page-client";

export default async function VocabularyPage() {
  const { userId } = await auth();
  const initialVocabulary = userId ? await getUserVocabularyAction() : [];

  return <VocabularyPageClient initialVocabulary={initialVocabulary} />;
}
