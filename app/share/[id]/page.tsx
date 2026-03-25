import { notFound, permanentRedirect } from "next/navigation";
import { normalizeAnalysisId } from "@/lib/analysis-id";

/**
 * 旧 /share/[id] は /analyses/[id] に統合。SEO・ブックマーク互換のため恒久的にリダイレクト。
 */
export default async function SharePageRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  const id = normalizeAnalysisId(resolved.id);
  if (!id) notFound();
  permanentRedirect(`/analyses/${id}`);
}
