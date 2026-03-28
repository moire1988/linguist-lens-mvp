# Cursor実装指示書：使役動詞コアイメージ特集ページ

> 対象スラッグ: `causative-verbs-make-let-have-get`
> URL: `/library/grammar/causative-verbs-make-let-have-get`
> 担当: @product-director 作成（2026-03-29）

---

## 概要

`ing-vs-to` に続く第2弾 SEO 集客コンテンツ。make/let/have/get の使役動詞4語を「コアイメージ（強制⇔許可⇔依頼⇔説得のスペクトル）」で解説するページを追加する。

**作業ファイル一覧（変更する全ファイル）:**
1. `data/grammar-lessons.ts` — 型拡張 + データ追記
2. `app/library/grammar/[slug]/page.tsx` — 4概念グリッドの条件分岐追加
3. `app/library/grammar/page.tsx` — インデックスにカード追加確認
4. （`ing-vs-to` の `relatedSlugs` に新 slug を追記）

---

## Step 1: 型拡張（data/grammar-lessons.ts）

### 1-1. `CoreConcept` インターフェースを追加

既存の `VerbPairExample` インターフェースの直前に追加:

```typescript
export interface CoreConcept {
  label: string;
  coreImage: string;
  metaphor: string;
  keyWords: string[];
  colorScheme?: "indigo" | "violet" | "emerald" | "amber";
}
```

### 1-2. `GrammarLesson` に `coreConcepts?` フィールドを追加

`GrammarLesson` の `relatedSlugs` の直前に追加:

```typescript
/** 3概念以上のレッスン用（coreConceptA/B の代替）。省略時は A/B グリッドを使用 */
coreConcepts?: CoreConcept[];
```

---

## Step 2: コンテンツデータ追記（data/grammar-lessons.ts）

`GRAMMAR_LESSONS` 配列の末尾（`ing-vs-to` エントリの閉じ `},` の後）に以下を追記:

```typescript
{
  slug: "causative-verbs-make-let-have-get",
  seoTitle: "使役動詞 make / let / have / get の違い｜コアイメージで完全攻略",
  seoDescription:
    "「make と have の違い」「get に to が付く理由」— 使役動詞4語を「強制・許可・依頼・説得」のコアイメージで整理。B1-C1向け例文・ミニクイズ付きで、試験にも会話にも役立つ実践的な解説です。",
  h1: "使役動詞（make / let / have / get）の違い：コアイメージで完全攻略",
  subtitle:
    "Why do natives say \"have him check\" not \"make him check\"? — Core Image Approach",
  targetLevels: ["B1", "B2", "C1"],
  category: "動詞パターン",
  publishedAt: "2026-03-29T00:00:00+09:00",
  readingMinutes: 14,
  intro:
    "「彼に確認させた」と言いたいとき、あなたは make / let / have / get のどれを使いますか？日本語では全部「〜させた」の一語で済んでしまうため、英語では4つの動詞が存在する理由を感覚的につかみにくいのです。この記事では、文法ルールの暗記ではなく「make は強制、let は許可、have は当然の依頼、get は説得」というコアイメージを使って、ネイティブがどのように4語を直感的に使い分けているかを解説します。",

  // 2概念グリッドを「補語の形式」軸で使用
  coreConceptA: {
    label: "原形補語グループ（make / let / have）",
    coreImage:
      "主語が「直接的な力・権限・役割」を持って補語の行為を引き起こす。補語の動詞は裸の原形（to なし）。",
    metaphor:
      "スイッチを押すと回路が流れるように、主語の力・許可・指示が直結して相手の行為を起動させるイメージ。間に「→」の矢印（目的意識）が入らない。",
    keyWords: ["直接的な因果", "裸の原形", "力・許可・役割", "スイッチ感"],
  },
  coreConceptB: {
    label: "to 不定詞グループ（get）",
    coreImage:
      "主語が交渉・説得・お願いという働きかけを通じて、相手が自発的に「→ やる」という方向性を向くよう導く。",
    metaphor:
      "ドアをノックして相手が開けてくれるのを待つイメージ。get は「相手の意志の矢印（to）」を引き出すプロセスを含む。",
    keyWords: ["説得・交渉", "to 不定詞", "相手の自発性", "努力のプロセス"],
  },

  // 4概念グリッド用（[slug]/page.tsx で coreConcepts があれば4列表示）
  coreConcepts: [
    {
      label: "make",
      coreImage:
        "外から力を加えて状態変化を引き起こす。相手に選択肢はない。「cause」に近い強制感。",
      metaphor:
        "ピストルを向けるように、相手が「やるしかない」状況を外力で作り出す。感情的になって言ったことも含む（Don't make me cry.）。",
      keyWords: ["強制", "外力", "選択肢なし", "cause"],
      colorScheme: "indigo",
    },
    {
      label: "let",
      coreImage:
        "相手がやりたいこと・通りたいことを「妨げずに通す」。ゲートを開ける感覚。",
      metaphor:
        "門番が柵を開けて「どうぞ」と言う。主語はあくまで許可を与える側。相手の意志を尊重しながらOKを出す。",
      keyWords: ["許可", "開放", "相手の意志尊重", "妨げない"],
      colorScheme: "emerald",
    },
    {
      label: "have",
      coreImage:
        "立場・役割・文脈から自然に「〜してもらう」手配をする。強制感も懇願感もない、当然の段取り。",
      metaphor:
        "マネージャーが部下にタスクをアサインする感覚。「頼む」というより「そういう役割だから」という含み。",
      keyWords: ["当然の依頼", "段取り", "役割・立場", "ニュートラル"],
      colorScheme: "amber",
    },
    {
      label: "get",
      coreImage:
        "説得・交渉・お願いを通じて相手が自発的にやることを引き出す。努力・働きかけのプロセスがある。",
      metaphor:
        "ドアを何度かノックして、相手が開けてくれるまで粘る。get は「to（矢印）」を引き出すプロセスを含む。",
      keyWords: ["説得", "交渉", "to不定詞", "努力が必要"],
      colorScheme: "violet",
    },
  ],

  verbPairs: [
    // ────────────────────────────────────────────────
    // 1. MAKE
    // ────────────────────────────────────────────────
    {
      verb: "make",
      coreInsight:
        "make は「外から力を加えて状態変化を起こす」使役動詞です。相手に選択肢はなく、主語の力・怒り・権威によって行為が引き起こされます。感情的な状況（Don't make me laugh.）から物理的強制（The cold made him shiver.）まで幅広く使われます。日本人は「させた」＝make と思いがちですが、make は「強制」が核であり、丁寧な依頼には不自然です。",
      ingImage:
        "外力によって相手（または物）の状態が変化するイメージ。ドミノを倒すように、主語の行為が直接的に次の状態変化を引き起こす。",
      toImage:
        "感情的・物理的・権威的な力が強く感じられる場面。上司が部下に強制する、環境が人の行動を変える、感情が思わず言葉を引き出すなどの状況。",
      examples: [
        {
          form: "to",
          sentence: "The new policy made employees work longer hours without extra pay.",
          translation: "新方針により、従業員は残業代なしで長時間働かされた。",
          nuanceNote:
            "「強制的に（残業させられた）」という含みがある。選択の余地がない状況での使役。ビジネス文脈では批判的なニュアンスを帯びることが多い。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "The movie made me cry three times.",
          translation: "その映画は3回も泣かせた。",
          nuanceNote:
            "「泣かせた」＝感情的な外力が自分を動かした。make は感情や環境が人を突き動かす場面でも自然に使われる。",
          scene: "daily",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "Don't make me repeat myself.",
          translation: "同じことを繰り返させないでくれ。",
          nuanceNote:
            "「繰り返させる」という強制のニュアンス。苛立ちや命令感が伴う表現。",
          scene: "daily",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "I made my colleague to stay late.",
          translation: "（誤）同僚に残業させた。",
          nuanceNote:
            "make の補語は裸の原形（to なし）。made my colleague stay late が正しい。",
          scene: "business",
          isCorrect: false,
          warningNote:
            "make / let / have + 補語 + 原形（to なし）は使役動詞の基本ルール。to を付けてしまうのは日本人の典型ミス。",
        },
      ],
    },

    // ────────────────────────────────────────────────
    // 2. LET
    // ────────────────────────────────────────────────
    {
      verb: "let",
      coreInsight:
        "let は「相手がやりたいことを妨げずに通す＝許可する」使役動詞です。make が「力で引き起こす」のに対し、let は「相手の意志を尊重してOKを出す」感覚。主語は許可を与える側で、相手の意志なしに使えません。また let は命令文・否定文（Don't let…）での使用頻度が高く、依頼や許可を求める場面（Let me know.）でも頻出します。",
      ingImage:
        "ゲートを開けて相手が通るのを妨げないイメージ。相手がすでに「やりたい」という意志を持っており、主語はそれをブロックしないだけ。",
      toImage:
        "子育て、許可の交渉、依頼表現（Let me do it.）など、相手の自主性を尊重するシーン。ビジネスでは Let me check that for you. のような丁寧な申し出でも頻出。",
      examples: [
        {
          form: "to",
          sentence: "She finally let her teenage daughter go to concerts alone.",
          translation: "彼女はついに10代の娘が一人でコンサートに行くことを許可した。",
          nuanceNote:
            "娘には「行きたい」という意志がある。母はそれをOKした（妨げなかった）。let の「許可・開放」感が出ている。",
          scene: "daily",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "Please let me know if there are any updates on the proposal.",
          translation: "提案書に更新があればお知らせください。",
          nuanceNote:
            "「知らせる行為を私にやらせてください（妨げないで）」という依頼。Let me know. はビジネスメールで最頻出の表現の一つ。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "Don't let the perfect be the enemy of the good.",
          translation: "完璧を求めるあまり、良いものを台無しにするな。",
          nuanceNote:
            "「完璧（という概念）が良いものを台無しにする」のを止めろ＝許可するな、という慣用的な警句。英語ビジネス文化でよく引用される。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "My boss let me to leave early yesterday.",
          translation: "（誤）上司が昨日早退させてくれた。",
          nuanceNote:
            "let の補語も裸の原形（to なし）。let me leave early が正しい。",
          scene: "business",
          isCorrect: false,
          warningNote:
            "let + 人 + 原形（to なし）。to を付けると文法ミスになる。",
        },
      ],
    },

    // ────────────────────────────────────────────────
    // 3. HAVE
    // ────────────────────────────────────────────────
    {
      verb: "have",
      coreInsight:
        "have は「立場・役割・文脈から自然に〜してもらう」使役動詞です。make のような強制感も、get のような説得・交渉感もなく、「当然の段取り・手配」として行為を依頼します。マネージャーが部下にタスクをアサインする、客が店員にサービスを頼む、オーナーが業者に修理を依頼するなど、役割関係が明確な場面で非常に自然です。また have O done（過去分詞）の受動的使役も重要。",
      ingImage:
        "マネージャーが部下に仕事を振るような、役割・立場から自然発生する依頼感。「頼む・強制する」というよりは「そういう流れで」という当然感。",
      toImage:
        "職場での業務指示、サービス業での依頼、専門家への発注など、役割関係が明確なシーン。「〜してもらった」を事実として報告するビジネス報告文でも頻出。",
      examples: [
        {
          form: "to",
          sentence: "I'll have our legal team review the contract before we sign.",
          translation: "署名前に法務チームに契約書を確認させます。",
          nuanceNote:
            "法務チームに確認させるのは「当然の段取り」。強制でも懇願でもなく、業務の流れとして自然な have の使い方。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "I had my car serviced at the dealership last week.",
          translation: "先週ディーラーで車を整備してもらった。",
          nuanceNote:
            "have O done（受動的使役）の形。「整備してもらった」＝専門家にやってもらう段取りをした。make や get より自然で事務的な響き。",
          scene: "daily",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "Can you have the report ready by Monday morning?",
          translation: "月曜の朝までにレポートを用意してもらえますか？",
          nuanceNote:
            "「〜してもらう（ように手配する）」という have の核が出ている。have the report ready は have O 形容詞（結果補語）の形。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "She had him to fix the bug immediately.",
          translation: "（誤）彼女はすぐにバグを修正させた。",
          nuanceNote:
            "have の補語は裸の原形。had him fix the bug が正しい。",
          scene: "business",
          isCorrect: false,
          warningNote:
            "have + 人 + 原形（to なし）。make / let / have は全て裸の原形を取る。",
        },
      ],
    },

    // ────────────────────────────────────────────────
    // 4. GET
    // ────────────────────────────────────────────────
    {
      verb: "get",
      coreInsight:
        "get は「説得・交渉・お願いを通じて相手が自発的にやることを引き出す」使役動詞です。make/let/have と異なり、補語に to 不定詞を取ります（get him to do）。これは get が「→（目的・方向性）を相手の中に生み出すプロセス」を内包しているため。日常会話では最も使われる使役表現の一つで、特に「なんとかしてもらった」という軽い労力感を伴う場面で自然です。",
      ingImage:
        "相手をどうにか説得して「to（矢印）」を向けさせるプロセスがあるイメージ。ドアを何度かノックして、相手が開けてくれるまで働きかける感覚。",
      toImage:
        "友人に何かをお願いした、子供を説得した、取引先を口説いたなど、努力・交渉の結果として「やってもらえた」場面。get only works when the other person is at least somewhat willing.",
      examples: [
        {
          form: "to",
          sentence: "She finally got her team to agree on a release date.",
          translation: "彼女はついにチームにリリース日を合意させることができた。",
          nuanceNote:
            "「ついに（finally）」という言葉が get の「努力・交渉プロセス」を反映している。チームを説得してようやく合意を引き出した。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "I can't get my kids to eat vegetables.",
          translation: "子どもたちに野菜を食べさせることができない。",
          nuanceNote:
            "説得しても子供が首を縦に振らない、という get の「働きかけが実を結ばない」ニュアンス。make なら強制できるが、get は相手の自発性が必要。",
          scene: "daily",
          isCorrect: true,
        },
        {
          form: "to",
          sentence: "How did you get the client to sign so quickly?",
          translation: "どうやってそんなに早くクライアントにサインさせたの？",
          nuanceNote:
            "「どう説得したの？」という get の交渉ニュアンスが自然に出ている。ビジネスでの成果報告・称賛の表現として頻出。",
          scene: "business",
          isCorrect: true,
        },
        {
          form: "ing",
          sentence: "I got him fix the problem.",
          translation: "（誤）彼に問題を修正させた。",
          nuanceNote:
            "get の補語は必ず to 不定詞。got him to fix the problem が正しい。裸の原形は使えない（make/let/have との違い）。",
          scene: "business",
          isCorrect: false,
          warningNote:
            "get + 人 + to + 原形（to が必要）。make/let/have との最大の違い。to を忘れると文法ミスになる。",
        },
      ],
    },
  ],

  sections: [
    {
      id: "why-japanese-struggle",
      heading: "なぜ日本人は使役動詞で詰まるのか？",
      body: "英語の使役動詞が4語もある最大の理由は、「どのような因果関係・力関係で行為が引き起こされるか」を英語が細かく区別するからです。一方、日本語の「〜させる」「〜してもらう」「〜してもらえる」は、文脈や敬語で同じ概念を表現するため、英語の4語の違いが感覚として入ってきません。\n\n**日本語の罠：**\n- 「彼に確認させた」→ make / have どちらも訳せてしまう\n- 「娘を行かせた」→ make（強制）か let（許可）かで意味が全然違う\n- 「部下に書かせた」→ make（命令）か have（役割として）かで全く異なるニュアンス\n\nルールを暗記するだけでは「なぜその動詞か」の感覚が身につかず、実際の会話で瞬時に選べません。4語のコアイメージを「因果の強さと種類」として覚えることで、初めて直感的な使い分けが可能になります。",
      callout:
        "「させた」と訳せるからといって make を選ぶのは危険。コアイメージ（強制か許可か依頼か説得か）で考える習慣をつけましょう。",
    },
    {
      id: "complement-form",
      heading: "補語の形式：原形 vs to 不定詞（なぜ get だけ違うのか）",
      body: "使役動詞の最重要文法ポイントは「補語の形式」です。\n\n| 動詞 | 補語の形 | 例 |\n|------|----------|----|\n| **make** | 裸の原形（to なし） | make him *do* |\n| **let** | 裸の原形（to なし） | let her *go* |\n| **have** | 裸の原形（to なし） | have them *check* |\n| **get** | to 不定詞 | get him *to agree* |\n\n**なぜ get だけ to が付くのか？**\n\nmake / let / have は「直接的な因果（力・許可・役割）」を表すため、主語の力が直結して補語の行為を起動させます。間に「→（方向性・目的意識）」の to が入る必要がありません。\n\n一方 get は「説得・交渉の結果として相手が自発的に向かう」というプロセスを含みます。相手の中に「→ やろう」という矢印（意志・方向性）が生まれることが get の本質で、だから to 不定詞が自然に必要になるのです。\n\nこの「to = 方向性・矢印」のコアイメージは、ing と to の使い分けと同じ原理です。",
      callout:
        "get + to は「説得して相手の中に矢印（意志）を向けさせる」感覚。make/let/have のスイッチ感との違いが to の有無に現れています。",
    },
    {
      id: "scene-guide",
      heading: "シーン別選択ガイド：どの動詞を選ぶ？",
      body: "**職場での指示・依頼:**\n\n- 「法務に確認させる」→ **have** が最もニュートラル・自然（役割として）\n- 「なんとか部長を説得して承認させる」→ **get** （交渉・努力が必要）\n- 「従業員に強制的にやらせる」→ **make**（強制感・批判的ニュアンスあり）\n- 「部下の提案を通す・許可する」→ **let**（相手の意志を認める）\n\n**子育て・家族:**\n\n- 「子供に宿題をやらせる」→ **make**（強制）または **get**（説得）\n- 「子供に行かせてあげる」→ **let**（許可・解放）\n- 「子供にお手伝いをしてもらう」→ **have**（当然の役割として）\n\n**サービス・業者への依頼:**\n\n- 「業者に修理してもらった」→ **have**（専門家への自然な手配）\n- 「修理屋をなんとか口説いた」→ **get**（交渉が必要だった）\n\n**まとめ（スペクトル）:**\n```\n強制 ← make ─────── have ─────── get ─────── let → 許可\n              依頼・段取り  説得・交渉    相手の意志尊重\n```",
      callout:
        "迷ったら「力関係と因果の種類」を問いかけよう。強制? 許可? 当然の手配? 説得? その答えがそのまま動詞になります。",
    },
    {
      id: "have-o-done",
      heading: "発展：have O done（受動的使役）",
      body: "have の発展的な使い方として **have O done（目的語 + 過去分詞）** があります。これは「〜してもらう・〜させる（第三者に行為をしてもらう）」という受動的な使役表現で、C1レベルでぜひ使いこなしたい高頻度表現です。\n\n```\nI had my hair cut.（髪を切ってもらった）\nWe had the system upgraded.（システムをアップグレードしてもらった）\nI need to have my suit dry-cleaned.（スーツをクリーニングに出さないといけない）\n```\n\n**have O done の2つの読み方:**\n\n1. **自発的な手配**（上記の例）: 自分が手配して専門家にやってもらった\n2. **被害・不本意な経験**: He had his wallet stolen.（財布を盗まれた）\n\nどちらも「have が『O に対して done の状態が生じる』手配・経験をした」という核は共通です。文脈で読み分けてください。\n\n比較：\n- get O done も同義で使えるが、get はより口語的・努力感あり\n- make O done は通常使わない（make は補語に原形または形容詞）",
      callout:
        "have O done は英語圏のビジネスメールで頻出。「業者に〜してもらった」「〜を手配した」を自然に表現できるC1必須パターンです。",
    },
  ],

  practiceItems: [
    {
      id: "causative-practice-01",
      prompt:
        "The manager _____ all team members submit a weekly status report.\n(Context: It's a company rule — no exceptions.)",
      options: [
        "got",
        "let",
        "made",
        "had",
      ],
      correctIndex: 2,
      explanation:
        "「会社のルールで例外なし」＝選択肢なし＝強制。make が最も適切。had も使えるがより中立的で「強制感」が薄い。got は説得プロセスを含むため不自然。let は許可なので文脈に合わない。",
    },
    {
      id: "causative-practice-02",
      prompt:
        "After three rounds of negotiation, she finally _____ the supplier _____ the delivery date.\n(Context: It took effort and persuasion.)",
      options: [
        "made / bring forward",
        "got / to bring forward",
        "had / bring forward",
        "let / bring forward",
      ],
      correctIndex: 1,
      explanation:
        "「交渉3回」「ようやく（finally）」＝説得・努力のプロセスあり＝get。get は to 不定詞が必要なので got the supplier to bring forward が正解。make も意味は成立するが「説得」ではなく「強制」のニュアンスになり、交渉の文脈と合わない。",
    },
    {
      id: "causative-practice-03",
      prompt:
        "I need to _____ my presentation slides _____ before tomorrow's board meeting.\n(Context: You'll ask a designer to fix them.)",
      options: [
        "make / redesigned",
        "get / redesign",
        "have / redesigned",
        "let / redesigned",
      ],
      correctIndex: 2,
      explanation:
        "「デザイナーに修正してもらう」＝専門家への当然の手配＝have。have O done（目的語 + 過去分詞）の形なので have my slides redesigned が正しい。get my slides redesigned も文法的には正しいが、get はより口語的で「交渉して」というニュアンスが加わる。",
    },
    {
      id: "causative-practice-04",
      prompt:
        "The new CEO _____ employees work from home up to three days a week.\n(Context: It's a new policy that employees appreciate.)",
      options: [
        "made",
        "got",
        "had",
        "let",
      ],
      correctIndex: 3,
      explanation:
        "従業員が「ありがたがっている（appreciate）」＝許可・解放＝let。made だと強制になり文脈に合わない。let employees work from home は「在宅勤務をOKした」という許可の意味で自然。",
    },
    {
      id: "causative-practice-05",
      prompt:
        "The cold weather _____ me _____ my outdoor morning run for the first time in months.\n(Context: You didn't want to skip it, but the weather was too harsh.)",
      options: [
        "had / skip",
        "let / skip",
        "got / to skip",
        "made / skip",
      ],
      correctIndex: 3,
      explanation:
        "「寒さが原因で（意志に反して）ランを休んだ」＝外力・環境が行為を引き起こす＝make。The cold made me skip は「自然の外力が人の行動を変えた」という make の典型的用法。make + 人 + 裸の原形なので made me skip が正しい（to skip は誤り）。",
    },
  ],

  proTip:
    "C1 レベルを目指すなら、have O done と get O done の使い分けを習得しましょう。「I had my laptop repaired.」（修理に出した、当然の手配）vs「I got my laptop repaired.」（なんとか修理してもらった、少し努力が必要だった）は微妙な違いですが、ネイティブはこの温度感を感じ取っています。また make a difference / make an impact のような「make + 抽象名詞」のコロケーションも、「外力が変化を起こす」という make のコアイメージと一致しています。4語のコアを体に染み込ませると、こうした派生表現も直感的に理解できるようになります。",

  relatedSlugs: [
    "ing-vs-to",
    "modal-verbs-core-image",
    "passive-voice-core-image",
    "prepositions-core-image",
  ],
},
```

---

## Step 3: `[slug]/page.tsx` の更新（4概念グリッド対応）

`app/library/grammar/[slug]/page.tsx` の既存の2カラムグリッドセクションを以下のように更新:

```tsx
{/* 既存コードを条件分岐で置き換え */}
<section className="mb-10">
  <h2 className="sr-only">コアイメージの比較</h2>
  {lesson.coreConcepts && lesson.coreConcepts.length > 0 ? (
    // 3概念以上: 2×2 グリッド
    <div className="grid sm:grid-cols-2 gap-4">
      {lesson.coreConcepts.map((concept) => (
        <GrammarConceptCard
          key={concept.label}
          label={concept.label}
          coreImage={concept.coreImage}
          metaphor={concept.metaphor}
          keyWords={concept.keyWords}
          colorScheme={concept.colorScheme ?? "indigo"}
        />
      ))}
    </div>
  ) : (
    // デフォルト: 既存の2列グリッド（A/B）
    <div className="grid md:grid-cols-2 gap-4">
      <GrammarConceptCard
        label={lesson.coreConceptA.label}
        coreImage={lesson.coreConceptA.coreImage}
        metaphor={lesson.coreConceptA.metaphor}
        keyWords={lesson.coreConceptA.keyWords}
        colorScheme="indigo"
      />
      <GrammarConceptCard
        label={lesson.coreConceptB.label}
        coreImage={lesson.coreConceptB.coreImage}
        metaphor={lesson.coreConceptB.metaphor}
        keyWords={lesson.coreConceptB.keyWords}
        colorScheme="violet"
      />
    </div>
  )}
</section>
```

また、`GrammarConceptCard` コンポーネント（`components/grammar/grammar-concept-card.tsx`）が `colorScheme` prop として `"emerald"` と `"amber"` を受け取れるように拡張が必要かどうか確認し、対応していない場合は追加する。

---

## Step 4: ing-vs-to の relatedSlugs 更新

`data/grammar-lessons.ts` の `ing-vs-to` エントリの `relatedSlugs` に以下を追加:

```typescript
relatedSlugs: [
  "causative-verbs-make-let-have-get",  // ← 追加
  "gerund-as-subject",
  "infinitive-of-purpose",
  "aspect-perfect-vs-simple",
  "modal-verbs-core-image",
  "prepositions-core-image",
],
```

---

## Step 5: /library/grammar インデックスページ確認

`app/library/grammar/page.tsx` を確認し、新スラッグが自動的に表示される実装になっているか確認する。`getAllGrammarSlugs()` や `GRAMMAR_LESSONS` を動的に読み込む実装であれば、データ追記だけで自動反映される。

---

## Step 6: ビルド確認

```bash
npm run build
```

エラーがないことを確認。特に:
- `coreConcepts` の型エラーがないか（`CoreConcept` interface の export 確認）
- `colorScheme` に `"emerald"` / `"amber"` が渡せるか
- `generateStaticParams` に新 slug が含まれるか

---

## 実装上の注意点

1. **後方互換性**: 既存の `coreConceptA / B` フィールドは削除しない。`coreConcepts` はオプション（`?`）。
2. **verbPairs の転用**: `ingImage` / `toImage` フィールドはリネームせず、使役動詞では「コアイメージ」「使いどころ」として意味的に使い回す。VerbPairCard コンポーネントはそのまま使える。
3. **VerbPairExample の `form` フィールド**: 使役動詞では `"to"` に統一（正誤は `isCorrect` で管理）。
4. **SEO最適化**: `publishedAt` を実装日に更新し、`seoTitle` / `seoDescription` は Step 2 のデータをそのまま使う。
