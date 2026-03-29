import type {
  CoreConcept,
  GrammarLesson,
  PracticeItem,
  VerbPair,
} from "@/data/grammar-lessons";

/** FAQ / HowTo 用に Markdown 風記法を薄く除去し、長さを制限する */
export function stripMarkdownForSchema(source: string, maxLen: number): string {
  let s = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > maxLen) {
    return `${s.slice(0, maxLen - 1)}…`;
  }
  return s;
}

function coreConceptsForLesson(lesson: GrammarLesson): CoreConcept[] {
  if (lesson.coreConcepts && lesson.coreConcepts.length > 0) {
    return lesson.coreConcepts;
  }
  return [
    { ...lesson.coreConceptA, colorScheme: "indigo" as const },
    { ...lesson.coreConceptB, colorScheme: "violet" as const },
  ];
}

function faqQuestionAnswer(
  name: string,
  text: string
): Record<string, unknown> {
  const t = text.trim();
  if (name.trim() === "" || t === "") {
    return {};
  }
  return {
    "@type": "Question",
    name: name.trim(),
    acceptedAnswer: {
      "@type": "Answer",
      text: t,
    },
  };
}

const FAQ_ANSWER_MAX = 2_000;
const FAQ_QUESTION_MAX = 200;
const HOWTO_STEP_TEXT_MAX = 1_200;

/**
 * 記事本文（コアイメージ・練習問題など）から FAQPage 用 mainEntity を組み立てる
 */
export function buildGrammarFaqMainEntities(
  lesson: GrammarLesson
): Record<string, unknown>[] {
  const entities: Record<string, unknown>[] = [];

  const overviewQ = `${lesson.h1}では何が学べますか？`.slice(
    0,
    FAQ_QUESTION_MAX
  );
  const overviewA = stripMarkdownForSchema(
    lesson.intro.trim() !== "" ? lesson.intro : lesson.seoDescription,
    FAQ_ANSWER_MAX
  );
  const o = faqQuestionAnswer(overviewQ, overviewA);
  if (Object.keys(o).length > 0) {
    entities.push(o);
  }

  const levelQ = `この特集はどの英語レベル向けですか？`.slice(
    0,
    FAQ_QUESTION_MAX
  );
  const levelA = `対象はおおむね CEFR ${lesson.targetLevels.join("・")} です。${lesson.subtitle}`;
  const l = faqQuestionAnswer(levelQ, stripMarkdownForSchema(levelA, FAQ_ANSWER_MAX));
  if (Object.keys(l).length > 0) {
    entities.push(l);
  }

  for (const c of coreConceptsForLesson(lesson)) {
    const q = `「${c.label}」のコアイメージとは何ですか？`.slice(
      0,
      FAQ_QUESTION_MAX
    );
    const kw =
      c.keyWords.length > 0 ? ` 関連キーワード: ${c.keyWords.join("、")}` : "";
    const a = stripMarkdownForSchema(
      `${c.coreImage} ${c.metaphor}${kw}`,
      FAQ_ANSWER_MAX
    );
    const item = faqQuestionAnswer(q, a);
    if (Object.keys(item).length > 0) {
      entities.push(item);
    }
  }

  const practiceCap = 4;
  for (let i = 0; i < Math.min(lesson.practiceItems.length, practiceCap); i++) {
    const p: PracticeItem = lesson.practiceItems[i] as PracticeItem;
    const q = stripMarkdownForSchema(p.prompt, FAQ_QUESTION_MAX);
    const a = stripMarkdownForSchema(p.explanation, FAQ_ANSWER_MAX);
    const item = faqQuestionAnswer(`（ミニクイズ）${q}`, a);
    if (Object.keys(item).length > 0) {
      entities.push(item);
    }
  }

  if (lesson.proTip.trim() !== "") {
    const tipQ = "上級者向けの補足（Pro Tip）はありますか？".slice(
      0,
      FAQ_QUESTION_MAX
    );
    const tipA = stripMarkdownForSchema(lesson.proTip, FAQ_ANSWER_MAX);
    const tip = faqQuestionAnswer(tipQ, tipA);
    if (Object.keys(tip).length > 0) {
      entities.push(tip);
    }
  }

  return entities;
}

function howToStep(name: string, text: string): Record<string, unknown> | null {
  const n = name.trim();
  const t = stripMarkdownForSchema(text, HOWTO_STEP_TEXT_MAX);
  if (n === "" || t === "") {
    return null;
  }
  return {
    "@type": "HowToStep",
    name: n.slice(0, 140),
    text: t,
  };
}

function buildHowToSteps(lesson: GrammarLesson): Record<string, unknown>[] {
  const steps: Record<string, unknown>[] = [];

  const concepts = coreConceptsForLesson(lesson);
  const coreBlock = concepts
    .map(
      (c) =>
        `【${c.label}】${c.coreImage} ${c.metaphor}`
    )
    .join("\n\n");
  const s0 = howToStep(
    "ステップ1: コアイメージを押さえる",
    coreBlock || lesson.seoDescription
  );
  if (s0) {
    steps.push(s0);
  }

  const verbCap = 5;
  for (let i = 0; i < Math.min(lesson.verbPairs.length, verbCap); i++) {
    const vp: VerbPair = lesson.verbPairs[i] as VerbPair;
    const body = `${vp.coreInsight}\n\n（-ing のイメージ）${vp.ingImage}\n（to のイメージ）${vp.toImage}`;
    const st = howToStep(
      `ステップ: 動詞「${vp.verb}」の -ing と to`,
      body
    );
    if (st) {
      steps.push(st);
    }
  }

  const sectionCap = 4;
  for (let i = 0; i < Math.min(lesson.sections.length, sectionCap); i++) {
    const sec = lesson.sections[i]!;
    let body = stripMarkdownForSchema(sec.body, HOWTO_STEP_TEXT_MAX);
    if (sec.callout) {
      body = `${body}\n\n補足: ${stripMarkdownForSchema(sec.callout, 400)}`;
    }
    const st = howToStep(sec.heading, body);
    if (st) {
      steps.push(st);
    }
  }

  const quizNames = lesson.practiceItems
    .slice(0, 2)
    .map((p) => p.prompt)
    .join(" / ");
  const quizStep = howToStep(
    "ミニクイズで理解度を確認する",
    quizNames
      ? `記事末のミニクイズで定着を確認しましょう。例: ${stripMarkdownForSchema(quizNames, 400)}`
      : "記事末のミニクイズで、コアイメージの理解度を確認しましょう。"
  );
  if (quizStep) {
    steps.push(quizStep);
  }

  return steps;
}

export type GrammarLessonSchemaGraphInput = {
  lesson: GrammarLesson;
  pageUrl: string;
  siteUrl: string;
};

/**
 * Article + FAQPage + HowTo を @graph でまとめた JSON-LD オブジェクト（GEO 向け）
 */
export function buildGrammarLessonSchemaGraph(
  input: GrammarLessonSchemaGraphInput
): Record<string, unknown> {
  const { lesson, pageUrl, siteUrl } = input;
  const faqMain = buildGrammarFaqMainEntities(lesson);
  let howToSteps = buildHowToSteps(lesson);
  if (howToSteps.length === 0) {
    const fallback = howToStep(
      "この特集の読み方",
      stripMarkdownForSchema(lesson.intro, HOWTO_STEP_TEXT_MAX)
    );
    if (fallback) {
      howToSteps = [fallback];
    }
  }

  const article: Record<string, unknown> = {
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: lesson.h1,
    description: lesson.seoDescription,
    datePublished: lesson.publishedAt,
    dateModified: lesson.publishedAt,
    author: {
      "@type": "Organization",
      name: "LinguistLens",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "LinguistLens",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo-sphere.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  const faqPage: Record<string, unknown> = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: faqMain,
  };

  const howTo: Record<string, unknown> = {
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: lesson.h1,
    description: lesson.seoDescription,
    totalTime: `PT${Math.max(1, lesson.readingMinutes)}M`,
    step: howToSteps,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [article, faqPage, howTo],
  };
}

/** generateMetadata 用: コアイメージ・見出しから補助 keywords を生成 */
export function buildGrammarLessonMetadataKeywords(
  lesson: GrammarLesson
): string[] {
  const concepts = coreConceptsForLesson(lesson);
  const fromConcepts = concepts.flatMap((c) => c.keyWords);
  const fromSections = lesson.sections.map((s) => s.heading);
  const merged = [
    lesson.h1,
    `英語 ${lesson.category}`,
    "英語 コアイメージ",
    `CEFR ${lesson.targetLevels.join(" ")}`,
    "linguistlens",
    ...fromConcepts,
    ...fromSections.slice(0, 4),
  ];
  const seen = new Set<string>();
  return merged.filter((k) => {
    const t = k.trim();
    if (t === "" || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}
