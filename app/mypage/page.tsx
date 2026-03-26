import { auth } from "@clerk/nextjs/server";
import { getUserVocabularyAction } from "@/app/actions/vocabulary";
import { MypagePageClient } from "./mypage-page-client";

export default async function MypagePage() {
  const { userId } = await auth();
  const initialVocabulary = userId ? await getUserVocabularyAction() : [];

  return <MypagePageClient initialVocabulary={initialVocabulary} />;
}
