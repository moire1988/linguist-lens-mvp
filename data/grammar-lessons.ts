// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoreConcept {
  label: string;
  coreImage: string;
  metaphor: string;
  keyWords: string[];
  colorScheme?: "indigo" | "violet" | "emerald" | "amber";
}

export interface VerbPairExample {
  form: "ing" | "to" | "in" | "on" | "at";
  sentence: string;
  translation: string;
  nuanceNote: string;
  scene: "daily" | "business" | "academic";
  isCorrect: boolean;
  warningNote?: string;
}

export interface VerbPair {
  verb: string;
  coreInsight: string;
  ingImage: string;
  toImage: string;
  /** 前置詞レッスン等でデフォルトの "-ing のイメージ" を上書きするラベル */
  ingLabel?: string;
  /** 前置詞レッスン等でデフォルトの "to のイメージ" を上書きするラベル */
  toLabel?: string;
  examples: VerbPairExample[];
}

export interface GrammarSection {
  id: string;
  heading: string;
  body: string;
  callout?: string;
}

export interface PracticeItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GrammarLesson {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  subtitle: string;
  targetLevels: ("B1" | "B2" | "C1")[];
  category: string;
  publishedAt: string;
  readingMinutes: number;
  intro: string;
  coreConceptA: {
    label: string;
    coreImage: string;
    metaphor: string;
    keyWords: string[];
  };
  coreConceptB: {
    label: string;
    coreImage: string;
    metaphor: string;
    keyWords: string[];
  };
  verbPairs: VerbPair[];
  sections: GrammarSection[];
  practiceItems: PracticeItem[];
  proTip: string;
  /** 3概念以上のレッスン用（coreConceptA/B と併用可。指定時は詳細ページで4概念グリッドを表示） */
  coreConcepts?: CoreConcept[];
  relatedSlugs: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    slug: "ing-vs-to",
    seoTitle: "ing と to の使い分け｜コアな感覚の違いを徹底解説",
    seoDescription:
      "stop smoking と stop to smoke の違い、わかりますか？動名詞（-ing）と to 不定詞のコアイメージを「実体」vs「矢印」の感覚で掴み、英語ネイティブの直感を身につけましょう。",
    h1: "ing と to の使い分け：コアな感覚の違い",
    subtitle:
      "Why do natives say 'stop smoking' but 'stop to smoke'? — Core Image Approach",
    targetLevels: ["B1", "B2", "C1"],
    category: "動詞パターン",
    publishedAt: "2026-03-28T00:00:00+09:00",
    readingMinutes: 12,
    intro:
      'あなたは "I stopped to smoke" と "I stopped smoking" の違いを、自信を持って説明できますか？どちらも文法的に正しい英語ですが、意味はまったく逆です。日本語ではどちらも「タバコを吸うのをやめた」と訳してしまいがちですが、ネイティブの耳には全然違う風景が浮かびます。この記事では、文法規則の暗記ではなく「-ing は実体、to は矢印」というコアイメージを使って、なぜ同じ動詞でも形によって意味が変わるのかを感覚的に理解していきます。',

    coreConceptA: {
      label: "動名詞（-ing）",
      coreImage:
        "行為をひとつの「実体・映像」として頭の中に掴む感覚。すでに起きた、あるいは現在進行中のリアルな行為を対象として扱う。",
      metaphor:
        "手のひらにのせた「ボール」のように。行為が物体として目の前にある感覚で、過去の出来事や繰り返しの習慣を語るときにしっくりくる。",
      keyWords: ["実体", "映像", "現実", "過去・現在の行為", "習慣"],
    },

    coreConceptB: {
      label: "to 不定詞",
      coreImage:
        "行為を「矢印（→）」で指し示す感覚。まだ実現していない、これからの方向性・可能性・目的を示す。",
      metaphor:
        "「→」の記号のように。矢印の先にある未来の行為を指差しているイメージで、これからやること・やりたいこと・目指していることを語るときに自然に使われる。",
      keyWords: ["方向性", "未来", "目的", "可能性", "未実現"],
    },

    verbPairs: [
      // ────────────────────────────────────────────────
      // 1. STOP
      // ────────────────────────────────────────────────
      {
        verb: "stop",
        coreInsight:
          "stop は「ing と to で意味が真逆になる」最もわかりやすい動詞です。stop -ing は「それまでやっていた行為（実体）を止める」、stop to do は「〜するために立ち止まる」つまり stop は「移動や活動を中断する」意味で、to 以下は目的を示す副詞的用法です。日本人は両方「やめた」と訳してしまいがちですが、後者には「やめた」の意味はまったく含まれません。",
        ingImage:
          "それまで手のひらに持っていたボール（行為）を、そっと地面に置くイメージ。行為が実体として存在していたからこそ、止めることができる。",
        toImage:
          "歩いている最中に「→あれをしよう」と矢印が生まれ、足を止めるイメージ。stop 自体が「立ち止まる」動作で、to 以下はその目的を示す別の動作。",
        examples: [
          {
            form: "ing",
            sentence: "She finally stopped checking her phone during dinner.",
            translation: "彼女はついに夕食中にスマホを見るのをやめた。",
            nuanceNote:
              "「夕食中ずっとスマホを見ていた」という実体のある行為が存在し、それを止めた。習慣的な行為を止めるニュアンスが ing の「実体感」によく合う。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence:
              "The company stopped offering free trials after the policy change.",
            translation: "方針変更後、同社は無料トライアルの提供をやめた。",
            nuanceNote:
              "「無料トライアルを提供していた」という継続的な行為（実体）が存在し、それが止まった。ビジネス文脈でよく使われる表現。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "He stopped to grab a coffee before heading into the meeting.",
            translation: "彼は会議室に入る前にコーヒーを取りに立ち寄った。",
            nuanceNote:
              "「歩いていた・向かっていた」という動作を一旦中断し、コーヒーを取るという目的（矢印）のために立ち止まった。「やめた」ではなく「寄り道した」に近い。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "I stopped to look at the view when I reached the top of the hill.",
            translation: "丘の頂上に着いたとき、景色を眺めるために立ち止まった。",
            nuanceNote:
              "歩くことを一時中断して「眺める→」という新しい目的が生まれた。to 以下は stop の目的を指す副詞的不定詞。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence: "I stopped to smoke.",
            translation: "（誤）タバコを吸うのをやめた。",
            nuanceNote:
              "この文は「タバコを吸うために立ち止まった」という意味になってしまう。「吸うのをやめた」と言いたければ stopped smoking が正しい。",
            scene: "daily",
            isCorrect: false,
            warningNote:
              "日本語の「〜するのをやめた」に引きずられて to を使ってしまう典型的なミス。stop の後に来る to 不定詞は「目的」であり「やめた対象」ではない。",
          },
        ],
      },

      // ────────────────────────────────────────────────
      // 2. REMEMBER
      // ────────────────────────────────────────────────
      {
        verb: "remember",
        coreInsight:
          "remember -ing は「過去に実際にやった記憶（実体）が今も頭の中にある」感覚、remember to do は「これからやるべきことを（忘れずに）記憶しておく」感覚です。過去への言及か未来への備えかで完全に形が決まります。日本語ではどちらも「覚えている」と訳せるため混乱しがちですが、時間軸が逆だと覚えましょう。",
        ingImage:
          "過去の行為がビデオクリップのように頭の中に再生される感覚。「あのとき確かにやった」という実体のある記憶を掴んでいる。",
        toImage:
          "カレンダーに「→〜すること」という矢印メモを貼っておくイメージ。まだ起きていない未来の行為に向けて、記憶を張り巡らせている。",
        examples: [
          {
            form: "ing",
            sentence:
              "I remember meeting her at a conference in Kyoto back in 2019.",
            translation: "2019年に京都の会議で彼女と会ったことを覚えている。",
            nuanceNote:
              "「2019年に会った」という過去の出来事（実体）が記憶として存在している。実際に起きたことを思い出しているので ing がしっくりくる。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence:
              "Researchers remember reading a similar finding in an earlier study.",
            translation: "研究者たちは以前の研究で類似の知見を読んだことを覚えている。",
            nuanceNote:
              "過去に実際に読んだ（実体のある行為）記憶が今も存在している。アカデミックな文脈でも ing で過去の経験を参照することがある。",
            scene: "academic",
            isCorrect: true,
          },
          {
            form: "to",
            sentence: "Remember to submit your expense report by Friday.",
            translation: "金曜までに経費精算書を提出するのを忘れないでください。",
            nuanceNote:
              "まだ提出していない（未実現）。「金曜に提出する→」という未来の行為を指差しながら、忘れないようにリマインドしている。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence: "Did you remember to turn off the gas before leaving?",
            translation: "出かける前にガスを消すの、ちゃんと覚えてた？",
            nuanceNote:
              "「ガスを消す→」という未来（出発前）の行為を念頭に置いていたか、という問いかけ。実際にやったかどうかではなく、意識していたかを聞いている。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "to",
            sentence: "I remember to lock the door last night.",
            translation: "（誤）昨夜ドアに鍵をかけたことを覚えている。",
            nuanceNote:
              "「昨夜かけた」は過去の実体ある行為なので remember locking が正しい。to は未来・目的の矢印なので、過去の出来事には使えない。",
            scene: "daily",
            isCorrect: false,
            warningNote:
              "「覚えている」という日本語に引きずられて to を使ってしまう誤り。時間軸が過去なら必ず ing。",
          },
        ],
      },

      // ────────────────────────────────────────────────
      // 3. TRY
      // ────────────────────────────────────────────────
      {
        verb: "try",
        coreInsight:
          "try -ing は「試しにやってみる（実験的・探索的）」、try to do は「〜しようと努力する（困難に向かって頑張る）」という違いがあります。ing は「実際に手を動かしてみる」感覚、to は「できるかどうかわからないがトライする」感覚です。「食べてみた」と「食べようとした（食べられなかった可能性あり）」の違いに相当します。",
        ingImage:
          "実際に手を動かして「とりあえずやってみる」感覚。試食・試運転のように、行為そのものを実体として体験してみる。",
        toImage:
          "ゴールに向かう矢印が「抵抗や困難」にぶつかるイメージ。達成できるかどうかはわからないが、努力・挑戦の方向性がある。",
        examples: [
          {
            form: "ing",
            sentence:
              "Have you tried adding a pinch of miso paste to your ramen broth?",
            translation: "ラーメンのスープに味噌を少し足してみたことある？",
            nuanceNote:
              "「実際に足してみる」という試み。料理の実験として行為（実体）を試してみる感覚。「うまくいくかも」という軽い探索的ニュアンスがある。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence:
              "We tried launching the campaign on TikTok, but the ROI wasn't there.",
            translation: "TikTok でキャンペーンを試みたが、ROI が見合わなかった。",
            nuanceNote:
              "実際に立ち上げてみた（実体として行動した）という経験を報告している。「試してみたが結果がよくなかった」という含みがある。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence: "I tried to open the jar but it was stuck tight.",
            translation: "瓶を開けようとしたが、きつく閉まっていた。",
            nuanceNote:
              "「開ける→」という目標に向かって努力したが、うまくいかなかった。to 不定詞は「達成できなかった可能性」を含むことが多い。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "The team tried to meet the deadline, but unforeseen issues delayed the release.",
            translation:
              "チームは締め切りに間に合わせようとしたが、予期せぬ問題でリリースが遅れた。",
            nuanceNote:
              "「締め切りに間に合う→」という目標に向かって努力したが達成できなかった。困難に向かう努力の矢印感が to のコアと一致する。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence: "I tried to eating sushi for the first time yesterday.",
            translation: "（誤）昨日初めて寿司を食べようとした。",
            nuanceNote:
              "これは文法的に誤り。to の後には原形が来る。「食べようとした（努力）」なら tried to eat、「試しに食べてみた」なら tried eating が正しい。",
            scene: "daily",
            isCorrect: false,
            warningNote:
              "try に限らず、to の後は必ず動詞の原形。「try to eating」のように ing をつけてしまうのは初中級者に多い文法ミス。",
          },
        ],
      },

      // ────────────────────────────────────────────────
      // 4. FORGET
      // ────────────────────────────────────────────────
      {
        verb: "forget",
        coreInsight:
          "forget -ing は「過去に実際にやったこと（実体）を忘れている」、forget to do は「これからやるべきこと（未来の矢印）を忘れる」という違いです。remember と対称的な関係にあります。I forgot meeting him は「会ったことを忘れた」（記憶喪失的）、I forgot to meet him は「会う約束を忘れた」（すっぽかし）です。日常でよく使う forget to do の方が頻度は高めです。",
        ingImage:
          "頭の中に残っているはずの「過去の映像（実体）」が、霞がかかって見えなくなるイメージ。実際に起きたことの記憶が消えている。",
        toImage:
          "カレンダーに書いておくべき「→〜すること」というメモが、頭の中から消えてしまったイメージ。やるべきタスクが記憶から抜け落ちた。",
        examples: [
          {
            form: "ing",
            sentence:
              "I completely forgot meeting you at the orientation — I'm so sorry!",
            translation:
              "オリエンテーションであなたとお会いしたこと、完全に忘れていました。本当に申し訳ありません！",
            nuanceNote:
              "「以前実際に会った」という過去の出来事（実体）を忘れている。記憶喪失的なニュアンスで、日常ではやや強い謝罪を伴うことが多い。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence:
              "The author had forgotten writing that paragraph — it was found in an old draft.",
            translation:
              "著者はその段落を書いたこと自体を忘れていた。古い草稿で発見されたのだ。",
            nuanceNote:
              "過去に書いたという実体のある行為の記憶が失われている。アカデミック・文芸的文脈でも自然に使われる表現。",
            scene: "academic",
            isCorrect: true,
          },
          {
            form: "to",
            sentence: "I forgot to attach the file — can I resend it?",
            translation: "ファイルを添付し忘れました。再送してもいいですか？",
            nuanceNote:
              "「ファイルを添付する→」という未来のタスクを記憶から落としてしまった。メールでの頻出フレーズ。to 不定詞が「やるべきこと」を指す典型例。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "Don't forget to back up your data before updating the system.",
            translation:
              "システムをアップデートする前に、必ずデータをバックアップしておいてください。",
            nuanceNote:
              "「バックアップする→」という未来のタスクを忘れないようにという注意。IT・業務系でよく使われるリマインド表現。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence: "I forgot to sending the report last week.",
            translation: "（誤）先週レポートを送るのを忘れた。",
            nuanceNote:
              "to の後には動詞の原形が必要なので forgot to send が正しい。forgot sending にすると「送ったことを忘れた」という別の意味になる。",
            scene: "business",
            isCorrect: false,
            warningNote:
              "to の後に ing 形を使う「to sending」は文法的に誤り。また意味の違いも理解しておく必要がある。",
          },
        ],
      },

      // ────────────────────────────────────────────────
      // 5. REGRET
      // ────────────────────────────────────────────────
      {
        verb: "regret",
        coreInsight:
          "regret -ing は「過去に実際にやったこと（実体）を後悔する」日常的な表現、regret to do は「〜しなければならないことを残念に思う」というフォーマルな婉曲表現です。後者は主にビジネス・公式文書で使われ、悪いニュースを丁重に伝える際の定型表現です（I regret to inform you that...）。日本人が英語ビジネス文書を書くときにぜひ使いこなしてほしい表現です。",
        ingImage:
          "過去にやった行為（実体）が胸の中で重くなるイメージ。あのとき選んだ道を振り返って「しまった」と感じる感覚。",
        toImage:
          "これから伝える・行う「悪いニュース→」に対して、それを指し示しながら「残念です」と言う感覚。フォーマルなビジネスシーンで使われる婉曲表現。",
        examples: [
          {
            form: "ing",
            sentence:
              "I regret snapping at him like that — it was totally uncalled for.",
            translation:
              "あんな風に彼にキツく当たったことを後悔している。完全に言い過ぎだった。",
            nuanceNote:
              "「キツく当たった」という過去の実体ある行為を後悔している。日常会話での率直な後悔表現。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence: "The firm regretted not diversifying its portfolio earlier.",
            translation:
              "その会社はもっと早くにポートフォリオを分散しなかったことを後悔した。",
            nuanceNote:
              "「分散しなかった」という不作為（実体のある過去の選択）を後悔している。ビジネスの文脈でも ing で過去の決断への後悔を表す。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "We regret to inform you that your application was unsuccessful at this time.",
            translation:
              "誠に遺憾ながら、今回のご応募は見送りとなりましたことをお知らせします。",
            nuanceNote:
              "「お知らせする→」という行為を指差しながら「それが残念だ」と伝える婉曲表現。採用・入学などの不合格通知で頻繁に使われるフォーマルな定型句。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "I regret to say that the proposed timeline is no longer feasible given the current constraints.",
            translation:
              "現在の制約を踏まえると、ご提案のスケジュールはもはや実現困難であることをお伝えしなければなりません。",
            nuanceNote:
              "悪いニュース（スケジュール変更）を伝える矢印を指差しながら「残念だが言わなければならない」という敬語的ニュアンス。ビジネス会議やメールでの高度な表現。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "ing",
            sentence:
              "I regret telling you that the project has been cancelled.",
            translation:
              "（注意）プロジェクトがキャンセルになったことをお伝えするのが残念です。",
            nuanceNote:
              "この文は文法的には正しいが、「あなたに伝えたことを後悔している」つまり「言わなければよかった」という意味になる。「残念ながらお伝えする」という意図なら regret to tell を使うべき。",
            scene: "business",
            isCorrect: false,
            warningNote:
              "regret の ing/to の違いは特にビジネス文書で重要。regret telling は「言ったことへの後悔」、regret to tell は「悲しいニュースを伝える婉曲表現」。意味がまるで違う。",
          },
        ],
      },
    ],

    sections: [
      {
        id: "why-japanese-struggle",
        heading: "なぜ日本人はここで詰まるのか？",
        body: "英語の動名詞（-ing）と to 不定詞は、日本語にはほぼ対応する文法概念がありません。日本語では「食べること」「食べるため」「食べるのをやめる」「食べたことを覚えている」のような違いは、助詞や文脈で表現するため、英語で形を変える必要性を感覚的に掴みにくいのです。\n\nまた、学校英語では「動詞によって ing か to が決まる」という暗記型の教え方が主流です。\"enjoy -ing\"、\"want to do\" といったリストを覚えることは出発点として有効ですが、それだけでは stop / remember / try / forget / regret のように**どちらも使えるが意味が変わる動詞**に対応できません。\n\nさらに厄介なのが日本語訳の罠です。「止めた」「覚えている」「後悔した」という日本語は、文の時間軸（過去の行為か未来のタスクか）を明示しないため、形を選ぶ手がかりにならないのです。だからこそ「文法規則の暗記」ではなく「コアイメージ」を使って、行為の時間軸と話し手の意識の向き方を感じ取る力が必要です。",
        callout:
          "日本語訳だけを頼りにしている限り、ing と to の選択ミスは永遠になくなりません。コアイメージで考える習慣を作りましょう。",
      },
      {
        id: "ing-core-image",
        heading: "-ing の根っこ：行為を「実体」として掴む",
        body: "動名詞（-ing）のコアイメージは「行為をひとつのボールとして手のひらに乗せる」感覚です。行為が映像・物体のように頭の中に存在しているから、それを記憶したり、楽しんだり、やめたりできます。\n\n**過去・現在のリアリティがキーワードです。** 「I enjoy swimming.」（泳ぐことが好き）は、実際に泳いだ経験・繰り返しの習慣という実体があるから enjoy できる。「Stop talking!」は、今まさに話している（実体）から stop できる。\n\ning の動名詞は「過去に起きたこと」「習慣的にやること」「感覚として経験したこと」と親和性が高く、enjoy / finish / avoid / consider / deny / admit / suggest / miss / risk などの動詞が後ろに ing を取るのも、これらの動詞がすべて「実体のある行為・経験」に言及するからです。\n\nまた、\"It's no use trying.\"（やってみても無駄だ）や \"Seeing is believing.\"（百聞は一見に如かず）のように、-ing が主語になる場合も「行為を実体化して語る」というコアイメージがそのまま機能しています。",
        callout:
          "ing のシグナルは「すでに起きた・今起きている・経験したリアルな行為」。過去の映像を頭の中に「掴んでいる」感覚です。",
      },
      {
        id: "to-core-image",
        heading: "to の根っこ：行為を「矢印」で指し示す",
        body: "to 不定詞のコアイメージは「矢印（→）で未来の行為を指し示す」感覚です。前置詞 to が「〜への方向性」を示すように、to 不定詞も「まだ実現していないこと・これから向かうこと」を指す矢印です。\n\n**未来・可能性・意図がキーワードです。** 「I want to travel abroad.」（海外旅行したい）は、まだ実現していない願望の方向性。「She decided to quit.」（辞めると決めた）は、これからの行動への意志の矢印。「It's important to stay hydrated.」（水分補給が大切だ）は、一般的な行為の必要性を示す矢印。\n\nwant / need / hope / plan / decide / expect / agree / refuse / manage / fail などの動詞が to を取るのは、これらがすべて「これから実現すること・できるかどうかわからないこと・目指していること」に言及するからです。\n\nさらに、to の「矢印感」は程度を示す形容詞（happy to help / afraid to ask）や目的を示す副詞的用法（I went to the store to buy milk）でも同様で、英語全体に一貫して流れるコアイメージです。",
        callout:
          "to のシグナルは「まだ起きていない・これから目指す・方向性として示す行為」。矢印の先にある未来を指差している感覚です。",
      },
      {
        id: "meaning-change-verbs",
        heading: "変化する動詞一覧：使い方次第で意味が変わる",
        body: "以下の動詞は ing と to の両方を取りますが、形によって意味が大きく変わります。コアイメージで理解すると、なぜ意味が変わるかが直感的にわかります。\n\n| 動詞 | -ing | to do |\n|------|------|-------|\n| **stop** | 〜するのをやめる（行為の中止） | 〜するために立ち止まる（目的） |\n| **remember** | 〜したことを覚えている（過去の記憶） | 〜することを忘れずに（未来のタスク） |\n| **forget** | 〜したことを忘れる（過去の記憶喪失） | 〜するのを忘れる（未来のタスク忘れ） |\n| **try** | 試しに〜してみる（実験的行為） | 〜しようと努力する（困難への挑戦） |\n| **regret** | 〜したことを後悔する（過去への悔恨） | 残念ながら〜する（丁寧な婉曲表現） |\n| **go on** | そのまま〜し続ける（継続） | 続いて〜する（話題転換・次のステップ） |\n| **mean** | 〜することを意味する（含意） | 〜するつもりだ（意図） |\n\nこれらすべてに共通するのは「ing = 過去・現実の行為（実体）」「to = 未来・方向性（矢印）」というコアイメージです。丸暗記ではなく、どちらの感覚に近いかを問いかける習慣をつけましょう。",
        callout:
          "表を丸暗記するのではなく、各動詞で「これは過去の実体か、未来の矢印か？」と問いかける習慣が大切です。",
      },
      {
        id: "native-judgment",
        heading: "ネイティブはどちらを選ぶ？自然な判断基準",
        body: "ネイティブスピーカーは ing と to を明示的なルールとして選んでいるわけではありません。幼少期から「行為の感触」として身体に刷り込まれているのです。ではどうすれば同じ感覚に近づけるでしょうか？\n\n**実践的な判断フロー：**\n\n1. **その行為は「すでに起きたこと」か「これから起きること」か？**\n   → 過去・経験・習慣 → ing を疑う\n   → 未来・目的・意図 → to を疑う\n\n2. **その動詞が表す感情・認知は「経験への言及」か「これからへの期待」か？**\n   → enjoy / miss / avoid / regret（過去経験型）→ ing\n   → want / hope / decide / plan（未来志向型）→ to\n\n3. **文脈の時間軸を確認する。**\n   → \"I remember...\" の後に続く内容が過去の話か未来のタスクかで形が決まる。\n\n**上級テクニック：** C1 レベルを目指すなら、どちらでも文法的に使える場面でコアイメージを使って意味を微妙にコントロールする力を磨きましょう。例えば「I like swimming.」（実体としての経験が好き）と「I like to swim.」（一般的にそうしたい傾向）では、前者の方が「実際に泳いでいる時の感覚」に近い温度感があります。この使い分けは日本語には存在しないが、ネイティブは自然に使い分けています。",
        callout:
          "「この行為は手のひらのボールか（ing）、矢印の先か（to）」という問いかけを習慣化することが、ネイティブ感覚への近道です。",
      },
    ],

    practiceItems: [
      {
        id: "practice-01",
        prompt:
          "The doctor advised him _____ immediately after the results came back.\n(Context: He hadn't quit yet — the doctor gave new advice.)",
        options: [
          "stopping smoking",
          "to stop smoking",
          "stop smoking",
          "stopped smoking",
        ],
        correctIndex: 1,
        explanation:
          "医師が「これからやめるように」と助言した（未来への矢印）ので to stop が正しい。さらに stop の後ろには、やめる対象として smoking（ing 形・実体）が続く。advise は to 不定詞を目的語にとる動詞。",
      },
      {
        id: "practice-02",
        prompt:
          "Oh no — I can't believe I forgot _____ the client about the change in schedule.",
        options: ["informing", "having informed", "to inform", "inform"],
        correctIndex: 2,
        explanation:
          "「クライアントに連絡するタスク（未来の矢印）」を忘れた、という意味なので forget to do の形が正しい。もし forgot informing にすると「連絡したこと自体を忘れた（記憶喪失）」という意味になってしまう。ビジネスでは forgot to inform の方が圧倒的に一般的。",
      },
      {
        id: "practice-03",
        prompt:
          "We tried _____ the budget proposal with a different format, and the board responded much more positively.",
        options: ["to present", "presenting", "have presented", "presented"],
        correctIndex: 1,
        explanation:
          "「別のフォーマットで試しにやってみた→結果が出た」という文脈なので tried presenting（試験的実行）が正しい。tried to present だと「提示しようとしたが（うまくいかなかった可能性）」という別のニュアンスになり、「結果が出た」という後半の文脈と矛盾する。",
      },
      {
        id: "practice-04",
        prompt:
          "I remember _____ about this theory in my first year, but I couldn't recall the author's name.",
        options: ["to learn", "to have learned", "learning", "learned"],
        correctIndex: 2,
        explanation:
          "「1年次に実際に学んだ」という過去の経験（実体）を覚えているので remember learning が正しい。過去の記憶を参照しているため、未来の矢印を表す to learn は使えない。アカデミックな文脈でも remember -ing で過去の学習経験を参照することは自然。",
      },
      {
        id: "practice-05",
        prompt:
          "We regret _____ you that the position has already been filled.",
        options: [
          "informing",
          "to inform",
          "having informed",
          "to have informed",
        ],
        correctIndex: 1,
        explanation:
          "「悲しいニュースをこれからお伝えする」という婉曲的フォーマル表現なので regret to inform が正しい。regret informing だと「お伝えしたことを後悔している（言わなければよかった）」という意味になってしまう。採用不合格通知や契約拒否など、ビジネス文書で頻出の定型表現。",
      },
    ],

    proTip:
      "C1 レベルを目指すなら、\"I like swimming\" と \"I like to swim\" のように「どちらも正しいが温度感が違う」微妙なニュアンスを使い分ける練習をしましょう。前者は実際に泳ぐ経験そのものの感触を語り、後者は習慣・傾向としての好みを示します。また、try -ing と try to do の違いをビジネス報告書で意図的に使い分けると、「実際に試みた（結果あり）」vs「試みたが困難だった」という情報を形だけで伝えられる、高度な表現力の証明になります。",

    relatedSlugs: [
      "causative-verbs-make-let-have-get",
      "gerund-as-subject",
      "infinitive-of-purpose",
      "aspect-perfect-vs-simple",
      "modal-verbs-core-image",
      "prepositions-in-on-at",
    ],
  },

  {
    slug: "causative-verbs-make-let-have-get",
    seoTitle: "使役動詞 make / let / have / get の違い｜コアイメージで完全攻略",
    seoDescription:
      "「make と have の違い」「get に to が付く理由」— 使役動詞4語を「強制・許可・依頼・説得」のコアイメージで整理。B1-C1向け例文・ミニクイズ付きで、試験にも会話にも役立つ実践的な解説です。",
    h1: "使役動詞（make / let / have / get）の違い：コアイメージで完全攻略",
    subtitle:
      'Why do natives say "have him check" not "make him check"? — Core Image Approach',
    targetLevels: ["B1", "B2", "C1"],
    category: "動詞パターン",
    publishedAt: "2026-03-29T00:00:00+09:00",
    readingMinutes: 14,
    intro:
      "「彼に確認させた」と言いたいとき、あなたは make / let / have / get のどれを使いますか？日本語では全部「〜させた」の一語で済んでしまうため、英語では4つの動詞が存在する理由を感覚的につかみにくいのです。この記事では、文法ルールの暗記ではなく「make は強制、let は許可、have は当然の依頼、get は説得」というコアイメージを使って、ネイティブがどのように4語を直感的に使い分けているかを解説します。",

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
            sentence:
              "The new policy made employees work longer hours without extra pay.",
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
            sentence:
              "She finally let her teenage daughter go to concerts alone.",
            translation: "彼女はついに10代の娘が一人でコンサートに行くことを許可した。",
            nuanceNote:
              "娘には「行きたい」という意志がある。母はそれをOKした（妨げなかった）。let の「許可・開放」感が出ている。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "to",
            sentence:
              "Please let me know if there are any updates on the proposal.",
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
            sentence:
              "I'll have our legal team review the contract before we sign.",
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
            sentence:
              "She finally got her team to agree on a release date.",
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
        options: ["got", "let", "made", "had"],
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
        options: ["made", "got", "had", "let"],
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
      "prepositions-in-on-at",
    ],
  },

  {
    slug: "prepositions-in-on-at",
    seoTitle: "前置詞 in / on / at の使い分け｜コアイメージで完全理解（B1-C1）",
    seoDescription:
      "「in Monday」はなぜ間違い？ in・on・at の3つを「囲み・面・点」のコアイメージで整理。時間・場所・乗り物・状態の全パターンを例文・ミニクイズ付きで解説します。",
    h1: "前置詞 in / on / at の使い分け：コアイメージで完全理解",
    subtitle:
      'Why does "at home" feel different from "in the house"? — The Core Image of Prepositions',
    targetLevels: ["B1", "B2", "C1"],
    category: "前置詞",
    publishedAt: "2026-03-29T00:00:00+09:00",
    readingMinutes: 11,
    intro:
      "「on Monday なのに in the morning? at 3 o'clock なのに in 2024?」前置詞は暗記しかないと思っていませんか？実は in・on・at には一貫したコアイメージがあります。in は「三次元の内側・囲み」、on は「面との接触」、at は「点・瞬間・地点」。この3つのイメージを掴めば、時間・場所・状態のどの文脈でも、丸暗記ゼロで自然な前置詞が選べるようになります。",

    coreConceptA: {
      label: "in",
      coreImage:
        "三次元の「内側・囲み」。境界線に取り囲まれた内部の空間。液体に沈む・容器の中にある・期間の「中に入っている」感覚。",
      metaphor:
        "水槽の中の魚のように、四方八方を囲まれた「中」にいるイメージ。立体的な空間・期間・状態の「内側」に包まれている感覚。",
      keyWords: ["内側", "囲み", "立体空間", "期間・幅のある時間", "状態の中"],
    },

    coreConceptB: {
      label: "at",
      coreImage:
        "地図上の「一点」・時間軸上の「瞬間」。活動・焦点が集中する「地点」。広がりや囲みのない、ピンポイントの位置。",
      metaphor:
        "地図にピンを刺すような感覚。「今ここにいる」「今この瞬間」という焦点が定まった一点。活動の焦点が集まる場所（at work, at school）にも使われる。",
      keyWords: ["点", "瞬間", "地点・ピンポイント", "活動の焦点", "時刻"],
    },

    coreConcepts: [
      {
        label: "in",
        coreImage:
          "三次元の内側・囲み。境界に包まれた「中」にある感覚。",
        metaphor:
          "水槽の中の魚。四方を囲まれた立体空間や期間の「内側」。",
        keyWords: ["内側", "囲み", "期間", "立体空間"],
        colorScheme: "indigo",
      },
      {
        label: "on",
        coreImage:
          "面・表面との「接触」。何かの上・面に触れている感覚。",
        metaphor:
          "テーブルの上のカップ。面に乗っている・触れている・接続されている感覚。デジタル媒体への「接続」にも。",
        keyWords: ["面・表面", "接触", "特定の日", "媒体・接続"],
        colorScheme: "emerald",
      },
      {
        label: "at",
        coreImage:
          "点・瞬間・地点。地図上のピン。活動の焦点が集まる一点。",
        metaphor:
          "地図にピンを刺すイメージ。ピンポイントの時刻・場所・活動地点。",
        keyWords: ["点", "瞬間", "時刻", "活動地点"],
        colorScheme: "violet",
      },
    ],

    verbPairs: [
      {
        verb: "時間表現",
        ingLabel: "in のイメージ（期間・幅）",
        toLabel: "on / at のイメージ（面・点）",
        coreInsight:
          "時間の前置詞は「幅の長さ」で決まります。in は「期間の内側」（in 2024 / in January / in the morning）、on は「特定の曜日・日付という面」（on Monday / on March 15）、at は「時刻・瞬間というピンポイント」（at 3 PM / at midnight）。最もよくある誤りは「in Monday」「at the morning」です。",
        ingImage:
          "in：長い時間の「内側」にいる感覚。年・月・季節・午前/午後などの幅のある期間の「中に入っている」。例: in 2024 / in March / in the morning / in the 20th century。",
        toImage:
          "on：曜日や日付という「面・ページ」の上にいる感覚。on Monday / on March 15。　at：時刻という「一点・瞬間」を指す。at 3 PM / at midnight / at noon / at dawn。",
        examples: [
          {
            form: "in",
            sentence: "The annual report will be published in Q3.",
            translation: "年次報告書は第3四半期に発行されます。",
            nuanceNote:
              "Q3（第3四半期）という幅のある期間の「内側」に発行される。月・四半期・年などの幅のある時間はすべて in。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "in",
            sentence: "I usually go for a run in the morning before work.",
            translation: "仕事前に朝ランニングをするのが習慣です。",
            nuanceNote:
              "「午前という時間帯の内側」。in the morning / in the afternoon / in the evening が自然（夜は at night が一般的な例外）。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "Let's reschedule the kickoff meeting to Monday at 10 AM.",
            translation:
              "キックオフ会議を月曜日の午前10時に変更しましょう。",
            nuanceNote:
              "on Monday（曜日という「面」）と at 10 AM（時刻という「点」）が自然に組み合わさる。英語ではこの2つを並べて使うのが頻出パターン。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "at",
            sentence:
              "The store closes at midnight on New Year's Eve.",
            translation: "大晦日の真夜中に店は閉まります。",
            nuanceNote:
              "at midnight（真夜中という時刻の「点」）と on New Year's Eve（特定の日という「面」）。どちらも「定点」を示す典型例。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "in",
            sentence: "The meeting is in Monday.",
            translation: "（誤）会議は月曜日にあります。",
            nuanceNote:
              "曜日・日付には on が正しい。on Monday / on a Monday morning。日本語の「〜に」が「in」に聞こえてしまうため、in を使う日本人学習者が多い。",
            scene: "business",
            isCorrect: false,
            warningNote:
              "「月曜日に」= on Monday（面）。「3月に」= in March（期間の内側）。「3時に」= at 3（点）。この3パターンがセットで最重要。",
          },
        ],
      },

      {
        verb: "場所・スケール感",
        ingLabel: "in のイメージ（囲み・内部）",
        toLabel: "on / at のイメージ（面・点）",
        coreInsight:
          "場所の前置詞は「どのスケール・どの捉え方か」で決まります。国・都市のような「立体的な内側・囲み」は in（in Japan / in Tokyo）、通り・道路などの「線・面の上」は on（on Fifth Avenue）、駅・空港・特定の建物入口など「活動地点・ピンポイント」は at（at the station / at the airport）です。",
        ingImage:
          "in：国・市・地域のような「広い立体空間の内側」。建物の「物理的な内部」にいることを強調するときも in（in the office building）。",
        toImage:
          "on：道路・通り・橋などの「線・面の上」。on Main Street / on the highway。　at：駅・空港・交差点などの「地点・ポイント」。スケールより「そこに立っている焦点」感。",
        examples: [
          {
            form: "in",
            sentence:
              "She's been living in Osaka for the past three years.",
            translation: "彼女はここ3年間大阪に住んでいます。",
            nuanceNote:
              "大阪という都市の「立体的な内側」に含まれている。国・都市・地域など広い空間の内側には in。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "in",
            sentence:
              "The head office is in the building on the left.",
            translation: "本社は左の建物の中にあります。",
            nuanceNote:
              "「建物の内側（in）」にある。「通り沿いの（on）」建物。2つの前置詞が自然に共存する例。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "The café is on the corner of Oak Street and 5th Avenue.",
            translation:
              "そのカフェはオーク通りと5番街の角にあります。",
            nuanceNote:
              "通り（線・面）の上に位置する。on the corner / on the street / on the highway など、道路・通り系は on。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "at",
            sentence:
              "I'll meet you at the main entrance of Tokyo Station at noon.",
            translation:
              "正午に東京駅の正面玄関で会いましょう。",
            nuanceNote:
              "「東京駅の正面玄関という地点（at）」で会う。at the station / at the airport / at the entrance は活動の焦点となる地点。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "at",
            sentence: "She's in the hospital.",
            translation: "（注意）彼女は入院中です。",
            nuanceNote:
              "in the hospital（US英語）＝「入院中・病院の建物の中」という意味になる。「病院にお見舞いに行く」なら at the hospital が自然（活動地点として）。British English では in hospital（無冠詞）で入院を表すことが多い。",
            scene: "daily",
            isCorrect: true,
            warningNote:
              "in the hospital（病院の建物の中 = 入院中）と at the hospital（病院という場所に来ている = お見舞い・外来）は含意が異なる。同様に in the office（オフィスの建物内）と at the office（職場にいる）も使い分けるとニュアンスが正確になる。",
          },
        ],
      },

      {
        verb: "交通手段・乗り物",
        ingLabel: "in のイメージ（囲まれる乗り物）",
        toLabel: "on のイメージ（面に乗る乗り物）",
        coreInsight:
          "乗り物の前置詞は「囲まれ感」で決まります。タクシー・車・エレベーターなど体が「囲まれる」乗り物は in（in a taxi / in the car）、バス・電車・飛行機・船など「面の上・大きな乗り物」は on（on the bus / on a plane）。自転車・バイク・馬など「またがる」ものも on。徒歩（on foot）も「地面という面」のイメージ。",
        ingImage:
          "in：体を囲む狭い乗り物（car, taxi, elevator, canoe）。「内側に入る」感覚の強い乗り物。in a car / in a cab / in an Uber。",
        toImage:
          "on：大きな乗り物の「面・甲板・床」の上。on the bus / on the train / on a plane / on a ship。またがるもの（bike, horse）や地面（foot）も on。",
        examples: [
          {
            form: "in",
            sentence:
              "We spent almost two hours stuck in a cab because of the traffic.",
            translation:
              "渋滞でタクシーの中に2時間近も閉じ込められた。",
            nuanceNote:
              "タクシーは体を囲む狭い空間。「内側に閉じ込められている」感覚が in と一致する。in a car / in a taxi / in an Uber はすべて自然。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "I was reading a report on the train when my phone died.",
            translation:
              "電車の中でレポートを読んでいたら携帯が切れた。",
            nuanceNote:
              "電車は「面・床の上に乗っている」感覚。on the train / on the bus / on the subway（米）は自然。「電車の中で」という感覚だが英語では on を使う点に注意。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "She commutes to work on her bicycle every day regardless of the weather.",
            translation:
              "天気に関わらず毎日自転車で通勤している。",
            nuanceNote:
              "自転車は「またがる」もの。表面・面に乗っている on のイメージ。on a bike / on horseback / on foot（徒歩）もすべて on。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "in",
            sentence:
              "I'll send you the document in the plane — I have Wi-Fi.",
            translation:
              "（誤）機内でWi-Fiがあるので、飛行機の中でドキュメントを送ります。",
            nuanceNote:
              "飛行機は on a plane が正しい（大きな乗り物の面）。in the plane は「機体の物理的な内側」という直接的すぎるニュアンスで不自然。",
            scene: "business",
            isCorrect: false,
            warningNote:
              "「飛行機の中で」= on the plane（大きな乗り物の面）。on the bus / on the train と同じ。car / taxi のような「囲む感覚」の強い小型乗り物だけ in。",
          },
        ],
      },

      {
        verb: "状態・状況表現",
        ingLabel: "in のイメージ（状況の囲みの中）",
        toLabel: "on / at のイメージ（面・地点）",
        coreInsight:
          "前置詞を使った状態表現もコアイメージで理解できます。in は「状態という囲みの内側」（in love / in trouble / in danger）、on は「ある活動・役割の面に乗っている」（on duty / on strike / on sale）、at は「ある状態の地点にある」（at risk / at peace / at war）。コアイメージで解釈すると丸暗記が不要になります。",
        ingImage:
          "in：感情・困難・状況という「囲み」の中にいるイメージ。in love（恋愛という状況の内側）、in trouble（問題という囲みの中）、in a meeting（会議という囲まれた状況）。",
        toImage:
          "on：活動・役割の「面」に乗っている。on duty（勤務の面）、on sale（販売の面）、on strike（ストの面）。　at：ある状態の「地点」にいる。at risk（リスクの地点）、at peace（平和の地点）、at war。",
        examples: [
          {
            form: "in",
            sentence:
              "The entire team is in a panic after the system went down.",
            translation:
              "システムが落ちてチーム全体がパニックになっている。",
            nuanceNote:
              "「パニックという状況の内側」に包まれている。in a panic / in a hurry / in shock / in a meeting はすべて「状況の囲みの中にいる」感覚。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "The item is currently on sale at 30% off for the holiday season.",
            translation:
              "その商品は現在ホリデーシーズン限定で30%オフのセール中です。",
            nuanceNote:
              "「セール（という活動・状態の面）に乗っている」。on sale / on offer / on display / on duty などは「その状態の面に乗っている」感覚。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "at",
            sentence:
              "Patients with underlying conditions are considered at higher risk.",
            translation:
              "基礎疾患のある患者はより高いリスクの地点にあると考えられます。",
            nuanceNote:
              "「リスクという地点・状態」にある。at risk / at war / at peace / at ease はどれも「その地点にいる状態」を表す。",
            scene: "academic",
            isCorrect: true,
          },
          {
            form: "on",
            sentence: "The city has been on war since last year.",
            translation: "（誤）その都市は昨年から戦争状態にある。",
            nuanceNote:
              "「戦争状態の地点」= at war が正しい。at war / at peace / at odds などは「対立・状態の地点」を表し、on は使わない。",
            scene: "academic",
            isCorrect: false,
            warningNote:
              "状態系慣用句は「点（at）・面（on）・囲み（in）」のどれに近い状態かを考えると覚えやすい。at war / at peace（地点）、on duty / on strike（面）、in trouble / in love（囲み）。",
          },
        ],
      },

      {
        verb: "コミュニケーション・メディア",
        ingLabel: "in のイメージ（文書の内容・状況の囲み）",
        toLabel: "on のイメージ（媒体・チャンネルの面）",
        coreInsight:
          "通信・メディアに関する前置詞も重要です。電話・テレビ・インターネット・SNSなどのデジタル媒体は on（on the phone / on TV / on Zoom / on Instagram）。一方、文書・書籍・メールの「内容の内側」を指すときは in（in the email / in the report）。会議・通話という「囲まれた状況の中」も in（in a meeting / in a call）。",
        ingImage:
          "in：文書・書籍・メールの「内容の内側」。in the email / in the report / in the article。または会議・通話という「囲まれた状況の中」（in a meeting）。",
        toImage:
          "on：電話・テレビ・インターネットという「電気的な面・チャンネル」に乗っている感覚。on the phone / on TV / on YouTube / on Zoom / on Instagram。",
        examples: [
          {
            form: "in",
            sentence:
              "I noticed a typo in the email you sent this morning.",
            translation:
              "今朝あなたが送ったメールに誤字を見つけました。",
            nuanceNote:
              "「メールの内容の内側」にある誤字。in the email / in the report / in the document は「内容・中身の内側」。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "in",
            sentence:
              "Sorry, I can't talk right now — I'm in a meeting.",
            translation:
              "すみません、今会議中で話せません。",
            nuanceNote:
              "会議という「囲まれた状況の中にいる」感覚。in a meeting / in a conference / in a call はすべて「状況の囲みの中」。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "I saw an interview with the CEO on TV last night.",
            translation:
              "昨晩テレビでCEOのインタビューを見ました。",
            nuanceNote:
              "テレビというメディア（面・チャンネル）の上で放映されている。on TV / on YouTube / on Instagram はすべて「メディアの面の上」。",
            scene: "daily",
            isCorrect: true,
          },
          {
            form: "on",
            sentence:
              "She presented her findings at the conference on Zoom.",
            translation:
              "彼女はZoomで学会にて調査結果を発表した。",
            nuanceNote:
              "on Zoom（Zoomというデジタル媒体の面）と at the conference（会議という地点・活動）の組み合わせ。on Teams / on Slack / on Zoom は全てオンラインプラットフォームなので on。",
            scene: "business",
            isCorrect: true,
          },
          {
            form: "in",
            sentence: "I found the solution in Google.",
            translation: "（誤）Googleで解決策を見つけました。",
            nuanceNote:
              "Googleというプラットフォーム（の面）で調べる場合は on Google が自然（または \"by Googling\"）。in Google は「Google社の中で」という全く別の意味になる。",
            scene: "daily",
            isCorrect: false,
            warningNote:
              "デジタルプラットフォーム・SNS・検索エンジンはすべて「面・チャンネル」の on。on Google / on YouTube / on X（Twitter）/ on LinkedIn。",
          },
        ],
      },
    ],

    sections: [
      {
        id: "why-japanese-struggle",
        heading: "なぜ日本人は前置詞で詰まるのか？",
        body: "英語の in / on / at は、日本語では基本的に「に」「で」という助詞に対応します。「月曜日に」も「3時に」も「駅に」も「テーブルに」も、すべて「に」か「で」の一語で済んでしまうため、英語の3つの前置詞が存在する理由を感覚的につかみにくいのです。\n\n学校英語では「at は時刻・on は曜日・in は月や年に使う」という暗記ルールが教えられます。これは出発点として正しいのですが、このルールだけでは「at home / in the house の違いは？」「on the bus なのに in a car なのはなぜ？」「in trouble と at risk はどう違う？」といった疑問には答えられません。\n\n暗記ルールが崩れる原因は、「場所・時間・状態」という3つの用法を別々に覚えようとするからです。コアイメージ（in = 囲み、on = 面、at = 点）を使えば、どの文脈でも同じ感覚で判断できます。",
        callout:
          "「に」「で」という一語で済む日本語に引きずられず、「囲み（in）・面（on）・点（at）」という3次元のイメージで判断する習慣をつけましょう。",
      },
      {
        id: "in-core-image",
        heading: "in のコア：「三次元の内側・囲み」",
        body: "in のコアイメージは「三次元の空間・境界線に囲まれた内側」です。\n\n**空間的な in:**\n- in a room（部屋の立体的な内側）\n- in Japan（国という大きな境界の内側）\n- in a cup（カップという容器の内側）\n\n**時間的な in:**\n時間にも「囲まれた期間」という感覚があります。in 2024（2024年という時間の囲みの内側）、in January（1月という時間帯の内側）、in the morning（午前という時間帯の内側）。\n\n**状態的な in:**\nin love（恋愛という状況に包まれている）、in trouble（問題という囲みの中）。感情・状態という「境界のある囲み」の中にいる感覚です。\n\n| 用法 | 例 | 感覚 |\n|------|----|------|\n| 空間 | in the room / in Japan | 立体的な囲み |\n| 時間 | in 2024 / in March / in the morning | 幅のある期間の内側 |\n| 状態 | in trouble / in love / in pain | 状況という囲みの中 |\n| 文書 | in the email / in the article | 内容の内側 |",
        callout:
          "in のシグナルは「立体的に囲まれた内側」。空間でも時間でも状態でも「その境界の中に入っている」感覚です。",
      },
      {
        id: "on-core-image",
        heading: "on のコア：「面との接触・接続」",
        body: "on のコアイメージは「面・表面との接触」です。物理的な接触だけでなく、デジタル媒体への「接続」、特定の日付という「ページ・面」、役割・状態の「上に乗っている」感覚まで、「面との関係」という核が一貫しています。\n\n**物理的な on:**\n- on the table（テーブルの面に接触している）\n- on the wall（壁の面に接触している）\n\n**時間的な on:**\non Monday（月曜という「ページ・面」の上）、on March 15（特定の「日付ページ」の上）。日付・曜日をカレンダーの「1ページ」として捉えるイメージです。\n\n**媒体・接続の on:**\non TV / on the phone / on Zoom / on the internet。電気的・デジタルな媒体は「チャンネルという面に乗っている」感覚です。\n\n| 用法 | 例 | 感覚 |\n|------|----|------|\n| 空間 | on the table / on the wall | 面への接触 |\n| 時間 | on Monday / on June 1st | 日・日付のページ |\n| 交通 | on the bus / on the train | 大きな乗り物の面 |\n| 媒体 | on TV / on Zoom | デジタル媒体への接続 |\n| 状態 | on duty / on sale / on fire | 役割・活動の面 |",
        callout:
          "on のシグナルは「何かの表面・面との接触・接続」。物理的な面から時間の「ページ」、デジタル媒体の「チャンネル」まで、面との関係が核です。",
      },
      {
        id: "at-core-image",
        heading: "at のコア：「点・瞬間・活動地点」",
        body: "at のコアイメージは「地図上の一点・時間軸上の瞬間」です。広がりも囲みもなく、焦点がピンポイントに集まる「点」です。\n\n**空間的な at:**\n- at the station（駅という地点）\n- at the corner（角という一点）\n- at the entrance（入り口という地点）\n\n国や都市のような「広い囲み（in）」でも、道路の「面（on）」でもなく、地図のピンのような「点・焦点」が at のシグナルです。\n\n**時間的な at:**\nat 3 PM（午後3時という時刻の一点）、at midnight（真夜中という瞬間）、at dawn（夜明けという瞬間）。時計で指せる「特定の時刻」はすべて at。\n\n**活動地点の at:**\nat work / at school / at home / at the gym。これらは「物理的な内側（in）」ではなく「その場所で活動中」という意味を持ちます。\n- \"I'm in the office.\"（オフィスの建物の中にいる。位置の情報）\n- \"I'm at the office.\"（オフィスで仕事中・働いている。活動の情報）\n\n| 用法 | 例 | 感覚 |\n|------|----|------|\n| 空間 | at the station / at the corner | 地点・ピンポイント |\n| 時間 | at 3 PM / at midnight | 時刻・瞬間 |\n| 活動 | at work / at school / at home | 活動地点・焦点 |\n| 状態 | at risk / at peace / at war | 状態の地点 |",
        callout:
          "at のシグナルは「ピンポイントの一点・瞬間・活動地点」。地図のピンを刺すように、広さや囲みのない「焦点が定まった点」がコアです。",
      },
      {
        id: "scale-and-size",
        heading: "場所のスケール感：どの広さなら in / on / at？",
        body: "場所の前置詞選びで最も役立つのは「スケール感」の考え方です。\n\n| スケール・性質 | 前置詞 | 例 |\n| --- | --- | --- |\n| 国・地域・都市 | in | in Japan / in Tokyo |\n| 通り・道路・橋 | on | on Main Street / on the highway |\n| 駅・空港・建物のポイント | at | at Shinjuku Station / at the airport |\n| 建物の内部（物理的） | in | in the office / in the library |\n| 建物の場所（活動地点） | at | at the office / at the library |\n\n**in と at の微妙な違い（建物・施設）:**\n同じ場所でも in と at では含意が変わります：\n- \"She's in the hospital.\"（病院の建物の中 = 入院中）\n- \"She's at the hospital.\"（病院にいる = 見舞い・外来などで訪問中）\n\nこの使い分けを習得すると、英語のニュアンスが格段に精密になります。",
        callout:
          "「大きな広がり = in」「面・通り = on」「ピンポイントな地点 = at」。スケール感で判断し、活動を表すときは at を疑いましょう。",
      },
    ],

    practiceItems: [
      {
        id: "prep-practice-01",
        prompt:
          "The annual conference will be held ___ the first Monday ___ November.\n（2つの空欄 — 両方に適切な前置詞を選んでください）",
        options: ["in / in", "on / in", "at / on", "on / at"],
        correctIndex: 1,
        explanation:
          "「11月の第1月曜日」→ on（曜日という面）+ in（11月という月の期間の内側）。on the first Monday in November が正しい。「曜日・日付（on）」と「月・年（in）」の組み合わせは英語で最もよく使われる時間表現のパターン。at は時刻（at 3 PM）に使うため、曜日や月には使えない。",
      },
      {
        id: "prep-practice-02",
        prompt:
          "She's not available right now — she's ___ a conference call with the Tokyo team.\n（Context: She's currently participating in the call.）",
        options: ["on", "in", "at", "for"],
        correctIndex: 1,
        explanation:
          "会議・通話という「囲まれた状況の中」にいる = in が正しい。in a meeting / in a call / in a conference call はすべて「その状況の内側にいる」という in の用法。on a call も口語では使われるが、\"in a conference call\" が最も自然。at は活動地点のため in よりも物理的な場所感が出てしまう。",
      },
      {
        id: "prep-practice-03",
        prompt:
          "I read about the merger ___ this morning's Financial Times.\n（Context: You read a physical or digital newspaper article.）",
        options: ["in", "on", "at", "from"],
        correctIndex: 0,
        explanation:
          "「フィナンシャル・タイムズの内容の内側に記事があった」= in が正しい。in the newspaper / in the magazine / in the article / in the report はすべて「文書・出版物の内容の内側」。on the Financial Times だと「FT のウェブサイト（デジタル媒体の面）で」という意味に近くなる。紙・デジタルどちらも記事の「内容」に言及する場合は in。",
      },
      {
        id: "prep-practice-04",
        prompt:
          "I've been waiting for you ___ the entrance. Where are you?\n（Context: You're standing at a specific point outside the building.）",
        options: ["in", "on", "at", "inside"],
        correctIndex: 2,
        explanation:
          "「入り口という地点に立っている」= at が正しい。at the entrance / at the gate / at the front desk はすべて「特定の地点・ポイント」を示す at の典型。in the entrance だと「入り口の内側（入り口を入った場所）」という意味になり不自然。on も道路・面のニュアンスになるため不適切。",
      },
      {
        id: "prep-practice-05",
        prompt:
          "The project team is currently ___ a tight deadline, so please avoid interruptions.\n（Context: The team is under pressure from the deadline.）",
        options: ["at", "on", "in", "under"],
        correctIndex: 3,
        explanation:
          "「締め切りというプレッシャーの下」= under a tight deadline が最も自然な慣用表現。under pressure / under deadline / under stress はすべて「上からの圧力・その影響下にある」という感覚。in a deadline も理解はできるが不自然。at a deadline は「締め切りの地点にいる」で意味は通るが under が正しいコロケーション。これは in/on/at の問題と見せかけて、慣用句（under）を問う上級問題。",
      },
    ],

    proTip:
      "C1 レベルを目指すなら、in / on / at の使い分けを「活動の焦点」として意識しましょう。\"I'm in the office\" と \"I'm at the office\" のように、同じ場所でも in は物理的位置、at は活動地点を示します。ビジネスメールで \"available at the office\" と書けば「オフィスで仕事中・対応可能」というニュアンスが伝わり、in the office より能動的な印象になります。また on は「接続・関係」という感覚を掴むと、on the team / on the project / on the committee のような「〜に関わっている」用法も自然に使いこなせます。さらに「in time（間に合って）vs on time（定刻通りに）」という有名な対比も、in（余裕という幅の中）と on（定刻という面・ルール）のコアイメージで直感的に区別できます。",

    relatedSlugs: [
      "ing-vs-to",
      "causative-verbs-make-let-have-get",
      "modal-verbs-core-image",
      "articles-core-image",
      "phrasal-verbs-in-on-out",
    ],
  },
];
