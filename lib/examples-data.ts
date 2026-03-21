import type { PhraseResult } from "@/lib/types";

export interface ExampleVideo {
  slug: string;
  emoji: string;
  title: string;
  sublabel: string;
  cefrRange: string;
  cefrRangeLabel: string;
  url: string;
  pageTitle: string;
  description: string;
  overallLevel: string;
  phrases: PhraseResult[];
  transcript: string;
}

// ─────────────────────────────────────────────────────────────────────────────

const EMMA_WATSON_PHRASES: PhraseResult[] = [
  {
    expression: "stand up for",
    type: "phrasal_verb",
    context: "Both men and women should feel free to be sensitive. Both men and women should feel free to be strong. It is time that we all stand up for gender equality.",
    context_translation: "男性も女性も、繊細でいい。男性も女性も、強くていい。今こそ、私たちみんながジェンダー平等のために声を上げるときです。",
    meaning_ja: "〜のために声を上げる、〜を支持する",
    nuance: "信念や権利のために積極的に行動・発言するニュアンス。単なる「支持する（support）」より能動的で、困難に立ち向かう姿勢が含まれる。",
    example: "We need to stand up for those who cannot speak for themselves.",
    example_translation: "自分では声を上げられない人たちのために、私たちが声を上げる必要があります。",
    cefr_level: "B1",
    why_hard_for_japanese: "日本語の「立ち上がる」は物理的な動作が先に浮かぶため、比喩的な「主張・擁護」の意味で能動的に使いこなすのが難しい。",
  },
  {
    expression: "feel free to",
    type: "grammar_pattern",
    context: "Both men and women should feel free to be sensitive. Both men and women should feel free to be strong.",
    context_translation: "男性も女性も、繊細でいい。男性も女性も、強くていい。",
    meaning_ja: "遠慮なく〜する、自由に〜してよい",
    nuance: "相手に許可や気軽さを伝える定型表現。権限を与えながら圧力を感じさせない柔らかさがある。フォーマル・カジュアル問わず使える万能表現。",
    example: "Please feel free to ask questions at any point during the presentation.",
    example_translation: "プレゼンの途中でも、遠慮なくご質問ください。",
    cefr_level: "A2",
    why_hard_for_japanese: "意味は分かっても「Please feel free to〜」の形を自分から自然に使いにくい。「ご自由に」というニュアンスを英語で出すときにとっさに出てこない。",
  },
  {
    expression: "take for granted",
    type: "idiom",
    context: "If you believe in equality, you might be one of those inadvertent feminists I spoke of earlier. And for this I applaud you. We are struggling for a uniting word, but the good news is we have a uniting movement.",
    context_translation: "平等を信じるなら、私が先ほど話した「意図せずフェミニスト」の一人かもしれません。そのことを称えます。統一した言葉を模索中ですが、嬉しいことに、統一した運動はすでにある。",
    meaning_ja: "〜を当然のことと思う、ありがたみを感じずにいる",
    nuance: "価値・存在・権利などを意識せず当然視すること。批判や反省のニュアンスを伴い「もっと感謝すべきなのに」という含みがある。",
    example: "We often take clean water for granted until it becomes scarce.",
    example_translation: "きれいな水が不足するまで、私たちはそれを当たり前のことと思いがちです。",
    cefr_level: "B2",
    why_hard_for_japanese: "take・for・granted の3語が組み合わさる熟語構造が直感的でない。また be taken for granted（ないがしろにされる）という受動形も頻出で使い分けが必要。",
  },
  {
    expression: "committed to",
    type: "collocation",
    context: "My government is committed to the UN Women campaign. My Prime Minister has given me his full support.",
    context_translation: "私の政府はUN Womenのキャンペーンに全力で取り組んでいます。首相も全面的な支援を約束してくれました。",
    meaning_ja: "〜に真剣に取り組んでいる、〜に尽力している",
    nuance: "義務感・責任感を伴った強い関与を表す。「好きでやっている」より「責任として取り組んでいる」ニュアンスが強く、ビジネス・政治・公の場で頻用される。",
    example: "Our company is fully committed to reducing carbon emissions by 2030.",
    example_translation: "私たちの会社は2030年までに二酸化炭素排出量を削減することに全力で取り組んでいます。",
    cefr_level: "B1",
    why_hard_for_japanese: "dedicated to / devoted to と混同しやすい。committed to は約束・宣言に基づく義務的関与で、組織や社会的目標への使用が多い。",
  },
  {
    expression: "make a difference",
    type: "collocation",
    context: "If not me, who? If not now, when? I hope you will join this movement. Humanity is our business. And the time is now.",
    context_translation: "私でなければ誰が？今でなければいつ？この運動に参加してほしい。人類の問題は私たちみんなの問題です。そして、今がそのときです。",
    meaning_ja: "変化をもたらす、意義ある影響を与える",
    nuance: "単に「変える」ではなく「重要でポジティブな変化」を生み出すニュアンス。社会問題・個人的行動どちらにも使えるポジティブな表現。",
    example: "Even small acts of kindness can make a difference in someone's day.",
    example_translation: "小さな親切でも、誰かの一日に大きな変化をもたらすことができます。",
    cefr_level: "B1",
    why_hard_for_japanese: "「差を作る」という直訳では意味が取れない。また make differences（複数形）とは言わないなど、数の扱いが日本語話者には不自然。",
  },
  {
    expression: "speak up",
    type: "phrasal_verb",
    context: "I am inviting you to step forward, to be seen and to ask yourself: if not me, who? If not now, when?",
    context_translation: "あなたに一歩踏み出してほしい、姿を見せてほしい。そして自問してほしい――私でなければ誰が？今でなければいつ？",
    meaning_ja: "声を上げる、はっきりと意見を言う",
    nuance: "沈黙を破って自分の意見・懸念を述べること。不公正・問題に対して積極的に発言するニュアンスが強く、courage（勇気）と一緒に語られることが多い。",
    example: "If you disagree with the policy, you should speak up at the meeting.",
    example_translation: "方針に反対なら、会議でしっかり意見を述べるべきです。",
    cefr_level: "B1",
    why_hard_for_japanese: "speak out と混同しやすい。speak up はより広く「声を上げる全般」、speak out は公の場での明確な批判・反対意見を指す傾向がある。",
  },
  {
    expression: "inadvertently",
    type: "collocation",
    context: "The more I have spoken about feminism the more I have realized that fighting for women's rights has too often become synonymous with man-hating. If there is one thing I know for certain, it is that this has to stop.",
    context_translation: "フェミニズムについて語れば語るほど、女性の権利のための戦いが「男性嫌い」と同一視されすぎていると気づきました。一つだけ確かなことがある――これは止めなければならない。",
    meaning_ja: "意図せず、うっかりと",
    nuance: "悪意はないが結果的に意図しない行動をしてしまった場合に使う副詞。accidentally より知的・フォーマルで「意識せぬうちに」というニュアンス。",
    example: "I inadvertently revealed the surprise by mentioning her name.",
    example_translation: "彼女の名前を口にしてしまい、うっかりサプライズを明かしてしまった。",
    cefr_level: "C1",
    why_hard_for_japanese: "accidentally との差が分かりにくい。accidentally は物理的ミスに、inadvertently は発言・情報漏洩・態度など意図しない行為全般に使う。",
  },
];

const EMMA_TRANSCRIPT = `Today we are launching a campaign called "HeForShe." I am reaching out to you because I need your help. We want to end gender inequality—and to do that we need everyone to be involved.

I was appointed six months ago and the more I have spoken about feminism the more I have realized that fighting for women's rights has too often become synonymous with man-hating. If there is one thing I know for certain, it is that this has to stop.

For the record, feminism by definition is: "The belief that men and women should have equal rights and opportunities." It is the theory of the political, economic and social equality of the sexes.

Both men and women should feel free to be sensitive. Both men and women should feel free to be strong. It is time that we all stand up for gender equality.

Men—I would like to take this opportunity to extend your formal invitation. Gender equality is your issue too. Because to date, I have seen my father's role as a parent being valued less by society despite my need of his presence as a child. I have seen young men suffering from mental illness, unable to ask for help for fear it would make them less of a man.

If you believe in equality, you might be one of those inadvertent feminists I spoke of earlier. You might inadvertently hold back those around you without ever meaning to. And for this I applaud you for listening.

My government is committed to the UN Women campaign. My Prime Minister has given me his full support.

We do not often take for granted the rights and opportunities that so many others have fought hard to secure. But we must speak up for those who cannot yet speak for themselves.

We can make a difference—but only if we act together. We are struggling for a uniting word, but the good news is we have a uniting movement.

I am inviting you to step forward, to be seen and to ask yourself: If not me, who? If not now, when?`;

// ─────────────────────────────────────────────────────────────────────────────

const JOBS_STANFORD_PHRASES: PhraseResult[] = [
  {
    expression: "connect the dots",
    type: "idiom",
    context: "You can't connect the dots looking forward; you can only connect them looking backward. So you have to trust that the dots will somehow connect in your future.",
    context_translation: "点と点は前を向いてはつなげられない。振り返って初めてつながる。だから、将来どこかでつながると信じるしかない。",
    meaning_ja: "点と点をつなぐ、バラバラな経験の意味を後から理解する",
    nuance: "一見無関係に見える経験や出来事が、振り返ると意味を持っていたと気づく比喩。「後から分かる必然性」や「点在する情報をつないで全体像を把握する」意味でも使われる。",
    example: "Only in hindsight could she connect the dots and see how each failure led to her success.",
    example_translation: "振り返って初めて、彼女は点と点がつながり、それぞれの失敗がどのように成功に導いたかを理解できた。",
    cefr_level: "B2",
    why_hard_for_japanese: "日本語に対応する慣用表現がなく、直訳でも意味が通じない。「点をつなぐ」というビジュアルメタファーを英語話者の感覚で身につける必要がある。",
  },
  {
    expression: "drop out",
    type: "phrasal_verb",
    context: "I dropped out of Reed College after the first six months, but then stayed around as a drop-in for another eighteen months or so before I really quit.",
    context_translation: "私は入学して6ヶ月でリード大学を中退しましたが、その後さらに18ヶ月ほど聴講生として残り、それから本当に辞めました。",
    meaning_ja: "（学校などを）中退する、退学する",
    nuance: "正式に離脱・退場すること。学校の文脈では最も自然だが、レース・競争・計画からの離脱にも使える。否定的ニュアンスのある一方、Jobsのように肯定的に語られる場合もある。",
    example: "She dropped out of the program after realizing it wasn't the right fit for her.",
    example_translation: "自分には合わないと気づき、彼女はプログラムを途中でやめた。",
    cefr_level: "A2",
    why_hard_for_japanese: "「ドロップアウト」はカタカナ語として定着しているが、drop out of〜という形で自然に使えるかどうかが問われる。",
  },
  {
    expression: "fall in love with",
    type: "collocation",
    context: "If I had never dropped in on that single calligraphy course in college, the Mac would have never had multiple typefaces or proportionally spaced fonts. I fell in love with the beauty of great typography.",
    context_translation: "あのカリグラフィーの授業に潜り込まなかったら、Macに複数のフォントや比例間隔のフォントは存在しなかったでしょう。私は美しいタイポグラフィーに夢中になっていました。",
    meaning_ja: "〜に夢中になる、〜に恋する（物・事にも使う）",
    nuance: "人への恋愛だけでなく、趣味・職業・場所などへの強い情熱・魅了を表す。Jobsのように自分の仕事への愛を語る文脈でよく使われる。",
    example: "After visiting Kyoto, she completely fell in love with Japanese architecture.",
    example_translation: "京都を訪れた後、彼女は日本建築に完全に魅了された。",
    cefr_level: "A2",
    why_hard_for_japanese: "人以外（物・場所・概念）に使える感覚が日本語話者には不自然。「好きになる」とは異なる「深く魅了される」の強さを表現する際に活用したい。",
  },
  {
    expression: "turn out",
    type: "phrasal_verb",
    context: "I didn't see it then, but it turned out that getting fired from Apple was the best thing that could have ever happened to me.",
    context_translation: "その時はわかりませんでしたが、Appleをクビになったことは、私の人生で起こり得た最良のことだったと、後からわかりました。",
    meaning_ja: "結果的に〜になる、〜であることが判明する",
    nuance: "予期しなかった結果や事実が明らかになること。ポジティブ・ネガティブどちらにも使えるが、「意外にも〜だった」という驚きを含むことが多い。",
    example: "The shortcut I took turned out to be longer than the original route.",
    example_translation: "使った近道は、結局もとのルートより長かった。",
    cefr_level: "B1",
    why_hard_for_japanese: "「ターンアウト」という発想がなく、turn out that〜とturn out to be〜の2パターンを整理して覚える必要がある。",
  },
  {
    expression: "drown out",
    type: "phrasal_verb",
    context: "Don't let the noise of others' opinions drown out your own inner voice.",
    context_translation: "他人の意見という雑音に、自分の内なる声をかき消させてはいけない。",
    meaning_ja: "（音・声などを）かき消す、圧倒して聞こえなくする",
    nuance: "大きな音や圧力で小さなものが聞こえなくなること。Jobsの文脈では比喩的に「外部の雑音が内なる声をかき消す」ことを警告している。",
    example: "The sound of the traffic completely drowned out our conversation.",
    example_translation: "交通の騒音で、会話がまったく聞こえなくなった。",
    cefr_level: "B2",
    why_hard_for_japanese: "物理的な「音を消す」と比喩的な「存在感・意見を消す」の両方で使えることを知らないと、比喩的用法で使いこなせない。",
  },
  {
    expression: "have the courage to",
    type: "grammar_pattern",
    context: "And most important, have the courage to follow your heart and intuition. They somehow already know what you truly want to become.",
    context_translation: "そして最も大切なのは、自分の心と直感に従う勇気を持つことです。それらはなぜか、あなたが本当になりたいものをすでに知っているのです。",
    meaning_ja: "〜する勇気を持つ",
    nuance: "単に「勇気がある」ではなく、具体的な行動を起こす勇気を強調するパターン。スピーチやモチベーション系の文脈で特に有効な表現。",
    example: "It takes real courage to admit when you're wrong in front of others.",
    example_translation: "人前で自分が間違いを認めるには、本当の勇気が必要です。",
    cefr_level: "B1",
    why_hard_for_japanese: "courage は可算・不可算が文脈依存で、「勇気を出す」を have the courage to〜と表現できるようになるまで練習が必要。",
  },
  {
    expression: "live up to",
    type: "phrasal_verb",
    context: "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma — which is living with the results of other people's thinking.",
    context_translation: "あなたの時間は限られている。だから他人の人生を生きることに費やしてはいけない。ドグマに囚われてはいけない――ドグマとは他人の思考の結果を生きることだ。",
    meaning_ja: "〜の期待・基準に応える、〜にふさわしくある",
    nuance: "期待・評判・約束・基準などを満たすか上回ること。否定形（can't live up to）でプレッシャーや失望の文脈でも多用される。",
    example: "The sequel failed to live up to the expectations set by the original film.",
    example_translation: "続編は前作が生んだ期待に応えられなかった。",
    cefr_level: "B2",
    why_hard_for_japanese: "「生きる（live）」というイメージから「期待に応える」の意味が連想しにくい。live up to expectations という定型パターンとして覚えるのが効果的。",
  },
  {
    expression: "stay hungry",
    type: "idiom",
    context: "Stay hungry. Stay foolish.",
    context_translation: "ハングリーであり続けよ。愚かであり続けよ。",
    meaning_ja: "（比喩）貪欲であり続ける、向上心を持ち続ける",
    nuance: "食欲としての「空腹」ではなく、成長・学習・挑戦への渇望を表す比喩。Jobsのこのフレーズは「現状に満足せず学び続けよ」というメッセージ。",
    example: "The best entrepreneurs stay hungry even after achieving early success.",
    example_translation: "優れた起業家は、初期の成功を収めた後も貪欲であり続ける。",
    cefr_level: "B2",
    why_hard_for_japanese: "「空腹のまま」という直訳から離れ、「欲求・向上心を維持する」という意味を能動的に使えるようになるには意識的な学習が必要。",
  },
];

const JOBS_TRANSCRIPT = `I am honored to be with you today at your commencement from one of the finest universities in the world. Truth be told, this is the closest I've ever gotten to a college graduation. Today I want to tell you three stories from my life. That's it. No big deal. Just three stories.

The first story is about connecting the dots.

I dropped out of Reed College after the first six months. I didn't have a dorm room, so I slept on the floor in friends' rooms, returned Coke bottles for the 5¢ deposits to buy food with, and walked the seven miles across town every Sunday night to get one good meal a week.

I fell in love with the beauty of great typography. None of this had even a hope of any practical application in my life. But ten years later, when we were designing the first Macintosh computer, it all came back to me.

You can't connect the dots looking forward; you can only connect them looking backward. So you have to trust that the dots will somehow connect in your future. You have to trust in something—your gut, destiny, life, karma, whatever.

I didn't see it then, but it turned out that getting fired from Apple was the best thing that could have ever happened to me. The heaviness of being successful was replaced by the lightness of being a beginner again, less sure about everything. It freed me to enter one of the most creative periods of my life.

Don't let the noise of others' opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition. They somehow already know what you truly want to become. Everything else is secondary.

Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma. If you try to live up to everyone else's expectations, you will never discover your own path.

Stay hungry. Stay foolish.`;

// ─────────────────────────────────────────────────────────────────────────────

const SINEK_TED_PHRASES: PhraseResult[] = [
  {
    expression: "figure out",
    type: "phrasal_verb",
    context: "And I think it all started with the question: Why would two scientists leave perfectly good jobs to start a company? What was it that made them do what they did?",
    context_translation: "すべては一つの疑問から始まったと思います。なぜ二人の科学者は、安定した職を捨ててまで会社を立ち上げたのか？何が彼らをそうさせたのか？",
    meaning_ja: "〜を理解する、〜を解明する",
    nuance: "思考・試行錯誤の末に答えや解決策にたどり着くプロセスを強調する。understand より「頑張って分かった」ニュアンスが強い。",
    example: "We need to figure out why our sales have been declining this quarter.",
    example_translation: "今四半期に売上が落ちている原因を解明する必要があります。",
    cefr_level: "B1",
    why_hard_for_japanese: "understand との使い分けが難しい。figure out は「考えて・調べて解明する」プロセスを含み、答えが最初から見えていない状況で使う。",
  },
  {
    expression: "inspired by",
    type: "collocation",
    context: "There are leaders and there are those who lead. Leaders hold a position of power or authority, but those who lead inspire us.",
    context_translation: "「リーダー」と「人々を導く者」は違います。リーダーは権力や権威の地位にいますが、人々を導く者は私たちを鼓舞してくれます。",
    meaning_ja: "〜に触発された、〜から着想を得た",
    nuance: "外部からのエネルギーや動機付けを受けて行動・創造する状態。Sinekの主張では「恐怖ではなく感動から動く」ことが重要で、inspired はそのポジティブな原動力を示す。",
    example: "She was inspired by her grandmother's resilience to pursue a career in medicine.",
    example_translation: "彼女は祖母のたくましさに触発されて、医療の道を目指した。",
    cefr_level: "B1",
    why_hard_for_japanese: "motivated by との使い分けが難しい。inspired by は理念・人物・芸術など「心が動かされる」体験的な動機に、motivated by はより実践的な誘因に使う傾向がある。",
  },
  {
    expression: "come up with",
    type: "phrasal_verb",
    context: "Every single person, every single organization on the planet knows what they do, 100 percent. Some know how they do it. But very few people or organizations know why they do what they do.",
    context_translation: "地球上のすべての人、すべての組織は、自分たちが何をしているかを100％知っています。やり方を知っている人もいる。しかし、なぜそれをするのかを知っている人や組織はほとんどいない。",
    meaning_ja: "〜を思いつく、〜を考え出す",
    nuance: "努力や思考の末に新しいアイデア・解決策・計画を生み出すこと。think of より「創造的プロセス」の強調があり、ビジネスや問題解決の文脈で非常に頻繁に使われる。",
    example: "The team managed to come up with a solution in under an hour.",
    example_translation: "チームは1時間以内に解決策を考え出すことができた。",
    cefr_level: "B1",
    why_hard_for_japanese: "think of との区別が難しい。come up with は「考え抜いた末の産物」感が強く、ビジネス英語でほぼ毎日使う頻出表現なのに受動的になりやすい。",
  },
  {
    expression: "go against",
    type: "phrasal_verb",
    context: "The Wright Brothers were not the only ones working on powered man flight. Samuel Pierpont Langley had, what most people would consider, the recipe for success. But he gave up. The Wright Brothers went against all conventional wisdom.",
    context_translation: "動力飛行に取り組んでいたのはライト兄弟だけではありませんでした。サミュエル・ラングレーは、多くの人が「成功の方程式」と思うものをすべて持っていた。しかし彼は諦めた。ライト兄弟はあらゆる常識に逆らいました。",
    meaning_ja: "〜に反する、〜に逆らう",
    nuance: "常識・規則・意見・流れに逆らって行動すること。否定的文脈だけでなく、イノベーション・革新の場面でポジティブに語られることも多い。",
    example: "His decision to turn down the promotion went against everyone's expectations.",
    example_translation: "昇進を断るという彼の決断は、みんなの予想に反するものだった。",
    cefr_level: "B2",
    why_hard_for_japanese: "go against のような「方向動詞 + 前置詞」の構造は日本語に直接対応する表現がなく、意味の習得自体より「自分で使う」段階で詰まりやすい。",
  },
  {
    expression: "in spite of",
    type: "grammar_pattern",
    context: "People don't buy what you do; they buy why you do it. And what you do simply proves what you believe. In fact, people will do the things that prove what they believe.",
    context_translation: "人は「何をするか」ではなく「なぜするか」を買う。あなたのすることは、あなたが信じるものを証明しているに過ぎない。実際、人々は自分が信じるものを証明する行動をとる。",
    meaning_ja: "〜にもかかわらず",
    nuance: "despite と同義だが、少しフォーマルで、前後の対比を強調したい場合に使いやすい。困難・障害を乗り越えた達成を語る文脈で特に効果的。",
    example: "In spite of the heavy rain, the outdoor concert went ahead as planned.",
    example_translation: "激しい雨にもかかわらず、野外コンサートは予定通り行われた。",
    cefr_level: "B1",
    why_hard_for_japanese: "despite との使い分けで悩む学習者が多い。in spite of は「〜という事実にもかかわらず」という強い逆接を意識して使うと自然。",
  },
  {
    expression: "be drawn to",
    type: "collocation",
    context: "Martin Luther King Jr. gave the 'I Have a Dream' speech, not the 'I Have a Plan' speech. The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe.",
    context_translation: "マーティン・ルーサー・キング・ジュニアは「私には計画がある」ではなく「私には夢がある」と演説した。目標は、あなたの持つものを必要とする全員とビジネスをすることではない。あなたが信じるものを信じる人とビジネスをすることだ。",
    meaning_ja: "〜に引き付けられる、〜に魅力を感じる",
    nuance: "意識的な選択というより、自然に引き寄せられる感覚を表す。「惹かれる」という受動的・本能的な魅力に最もフィットする表現。",
    example: "She has always been drawn to complex problems that others find too difficult.",
    example_translation: "彼女はいつも、他の人には難しすぎると感じるような複雑な問題に惹きつけられてきた。",
    cefr_level: "B2",
    why_hard_for_japanese: "attracted to との差が曖昧に感じられる。be drawn to は内面的・精神的な引力（価値観・信念の共鳴）に、attracted to は外見・特徴への魅力に使いやすい。",
  },
  {
    expression: "pull off",
    type: "phrasal_verb",
    context: "Those who lead are able to inspire people to act. Those who lead make us feel safe. We feel like we belong. And we follow not because we have to, but because we want to.",
    context_translation: "人々を導く者は、行動を促すことができる。人々を導く者は安心感を与えてくれる。自分がそこに属していると感じさせてくれる。私たちが従うのは、そうしなければならないからではなく、そうしたいからだ。",
    meaning_ja: "（難しいことを）やり遂げる、成し遂げる",
    nuance: "困難・リスクがある中で計画や挑戦を成功させること。achieve や accomplish よりカジュアルで、「よくぞやった」という驚きや賞賛の含みがある。",
    example: "No one believed they could pull off the product launch in just three weeks.",
    example_translation: "たった3週間でプロダクトローンチを成功させるなんて、誰も信じていなかった。",
    cefr_level: "B2",
    why_hard_for_japanese: "pull が「引く」という物理的イメージと結びつくため、「やり遂げる」という比喩的意味への転換が難しい。achieve とのニュアンス差（難易度・驚き）も使い分けポイント。",
  },
  {
    expression: "make a case for",
    type: "collocation",
    context: "Why is Apple so innovative? Year after year, after year, they're more innovative than all their competition. And yet, they're just a computer company. They're just like everyone else.",
    context_translation: "なぜAppleはこれほど革新的なのか？年々、競合他社より革新的でいる。それでいて、ただのコンピュータ会社です。他の会社と何も変わらない。",
    meaning_ja: "〜の正当性を主張する、〜のための論拠を示す",
    nuance: "論理的・説得的に何かの価値や必要性を主張すること。単に「言う」より議論・証拠・理由を用いてアピールするニュアンスがある。ディベートやビジネス提案でよく使われる。",
    example: "The report makes a strong case for investing in renewable energy.",
    example_translation: "その報告書は、再生可能エネルギーへの投資の正当性を強く主張している。",
    cefr_level: "C1",
    why_hard_for_japanese: "日本語の「主張する」と直結しないため、英語でプレゼンや議論をするとき make a case for〜という形で使えるようになるまで練習が必要。",
  },
];

const SINEK_TRANSCRIPT = `How do you explain when things don't go as we assume? Or better, how do you explain when others are able to achieve things that seem to defy all assumptions?

Every single person, every single organization on the planet knows what they do, 100 percent. Some know how they do it. But very few people or organizations know why they do what they do. Most companies can only come up with strategies based on what they produce, never why they exist.

Why is Apple so innovative? Year after year, after year, they're more innovative than all their competition. And yet, they're just a computer company. They're just like everyone else. They have the same access to the same talent, the same agencies, the same consultants.

People don't buy what you do; they buy why you do it. And what you do simply proves what you believe.

The Wright Brothers were not the only ones working on powered man flight. Samuel Pierpont Langley had all the resources. But the Wright Brothers went against all conventional wisdom and managed to pull off what no well-funded competitor could. In spite of having far fewer resources, they succeeded because they were inspired by a vision of what flight could mean for the world.

Martin Luther King Jr. gave the "I Have a Dream" speech, not the "I Have a Plan" speech. He made a case for equality so powerfully and so clearly that people felt drawn to his cause from across the country.

There are leaders and there are those who lead. Leaders hold a position of power or authority. But those who lead inspire us. We follow them not because we have to, but because we want to. We follow those who lead not for them, but for ourselves—to figure out who we are and what we believe.

And it's those who start with 'why' that have the ability to inspire those around them.`;

// ─────────────────────────────────────────────────────────────────────────────

export const EXAMPLES: ExampleVideo[] = [
  {
    slug: "emma-watson-un",
    emoji: "🎤",
    title: "Emma Watson UN スピーチ",
    sublabel: "HeForShe · 国連演説",
    cefrRange: "A2 〜 B1",
    cefrRangeLabel: "初〜中級",
    url: "https://www.youtube.com/watch?v=gkjW9PZBRfk",
    pageTitle: "Emma Watson HeForShe スピーチ で学ぶ英語表現 | LinguistLens",
    description: "Emma Watson が2014年に国連で行ったHeForSheスピーチ。明瞭で聞き取りやすい英語から、A2〜B1レベルの学習者必修フレーズを厳選しました。",
    overallLevel: "B1",
    phrases: EMMA_WATSON_PHRASES,
    transcript: EMMA_TRANSCRIPT,
  },
  {
    slug: "jobs-stanford",
    emoji: "🍎",
    title: "Jobs Stanford スピーチ",
    sublabel: "Stanford 2005",
    cefrRange: "B2 〜 C1",
    cefrRangeLabel: "中上級〜上級",
    url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    pageTitle: "Steve Jobs Stanford スピーチ で学ぶ英語表現 | LinguistLens",
    description: "Steve Jobs が2005年スタンフォード大学卒業式で行った伝説のスピーチ。句動詞・慣用表現を中心にB2〜C1レベルのフレーズを厳選しました。",
    overallLevel: "C1",
    phrases: JOBS_STANFORD_PHRASES,
    transcript: JOBS_TRANSCRIPT,
  },
  {
    slug: "simon-sinek-ted",
    emoji: "💡",
    title: "Simon Sinek TED Talk",
    sublabel: "How Leaders Inspire",
    cefrRange: "B1 〜 B2",
    cefrRangeLabel: "中級〜中上級",
    url: "https://www.youtube.com/watch?v=qp0HIF3SfI4",
    pageTitle: "Simon Sinek TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Simon Sinek の人気TED Talk「Why Leaders Inspire Action」。ビジネス英語の必須フレーズをB1〜B2レベルで解説します。",
    overallLevel: "B2",
    phrases: SINEK_TED_PHRASES,
    transcript: SINEK_TRANSCRIPT,
  },
];
