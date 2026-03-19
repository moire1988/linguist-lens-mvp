import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXAMPLES } from "@/lib/examples-data";
import { ExamplePageContent } from "./content";

// ─── SSG ─────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const ex = EXAMPLES.find((e) => e.slug === params.slug);
  if (!ex) return {};
  const siteUrl = "https://linguist-lens-mvp.vercel.app";
  return {
    title: ex.pageTitle,
    description: ex.description,
    openGraph: {
      type: "article",
      url: `${siteUrl}/examples/${ex.slug}`,
      title: ex.pageTitle,
      description: ex.description,
      images: [{ url: "/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ex.pageTitle,
      description: ex.description,
      images: ["/og"],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamplePage({ params }: { params: { slug: string } }) {
  const ex = EXAMPLES.find((e) => e.slug === params.slug);
  if (!ex) notFound();
  return <ExamplePageContent example={ex} />;
}
