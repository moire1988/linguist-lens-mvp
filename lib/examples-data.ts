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

// ─────────────────────────────────────────────────────────────────────────────

const MATT_CUTTS_PHRASES: PhraseResult[] = [
  {
    expression: "add to",
    type: "phrasal_verb",
    context: "Think about something you've always wanted to add to your life and try it for the next 30 days.",
    context_translation: "自分の人生に加えたいと思っていたことを考えて、次の30日間試してみてください。",
    meaning_ja: "〜に加える、〜に付け加える",
    nuance: "「増やす・加える」という動作を表す最も基本的な句動詞の一つ。物理的なものだけでなく、習慣・価値・意味など抽象的なものを「追加する」場合にも使える。",
    example: "Regular exercise can add a lot of value to your daily routine.",
    example_translation: "定期的な運動は、日常生活に大きな価値を加えてくれます。",
    cefr_level: "A1",
    why_hard_for_japanese: "「追加する（add）」は知っていても、「add to 〜」の形で句動詞として使う感覚が身につきにくい。",
  },
  {
    expression: "give it a try",
    transcriptHighlight: "give it a shot",
    type: "collocation",
    context: "Is there something you've always wanted to try? Why not give it a try for 30 days?",
    context_translation: "ずっとやってみたかったことはありますか？30日間試してみてはどうでしょう？",
    meaning_ja: "試しにやってみる",
    nuance: "「try it」より口語的で親しみやすいニュアンス。「とりあえずやってみよう」という軽い挑戦を促す表現。失敗してもいいから一度やってみよう、という雰囲気がある。",
    example: "I've never cooked Japanese food before, but I decided to give it a try.",
    example_translation: "日本料理を作ったことはなかったけど、試しにやってみることにしました。",
    cefr_level: "A2",
    why_hard_for_japanese: "「try it」で十分と思ってしまい、「give it a try」という自然な会話表現を使えない学習者が多い。",
  },
  {
    expression: "stick with",
    transcriptHighlight: "stuck with",
    type: "phrasal_verb",
    context: "The months when I actually stuck with it were more memorable than the months I didn't.",
    context_translation: "実際にやり続けた月は、そうでなかった月よりずっと記憶に残っています。",
    meaning_ja: "〜を続ける、〜をやり通す",
    nuance: "困難や誘惑があっても辞めずに続けること。「continue」より「粘り強く続ける」意志の強さが含まれる。習慣・計画・決断などに使う。",
    example: "It's hard to stick with a new exercise routine for the first two weeks.",
    example_translation: "新しい運動習慣を最初の2週間続けるのは難しいです。",
    cefr_level: "A2",
    why_hard_for_japanese: "「続ける（continue）」は知っていても、意志を伴う「やり通す」という強いニュアンスを持つ stick with を使いこなせない。",
  },
  {
    expression: "write down",
    type: "phrasal_verb",
    context: "If you want something badly enough, try it for 30 days. Write down your goals every morning.",
    context_translation: "本当にやりたいことがあれば、30日間試してみてください。毎朝、目標を書き留めましょう。",
    meaning_ja: "書き留める、メモする",
    nuance: "単に「書く（write）」ではなく、忘れないよう記録として残すニュアンスがある。メモ・目標・アイデアを保存する行為として日常的によく使われる。",
    example: "Always write down new vocabulary words in a notebook.",
    example_translation: "新しい単語はいつもノートに書き留めましょう。",
    cefr_level: "A1",
    why_hard_for_japanese: "「書く」は write だけで表現しようとしがちで、「書き留める」という記録の意味を持つ write down を自然に使えない。",
  },
  {
    expression: "look back on",
    type: "phrasal_verb",
    context: "When I look back on the last 10 years, the months when I had 30-day challenges were the most memorable.",
    context_translation: "過去10年を振り返ると、30日間チャレンジをしていた月が最も記憶に残っています。",
    meaning_ja: "〜を振り返る、回顧する",
    nuance: "過去の経験や時間を振り返る際に使う表現。後悔や懐かしさなどの感情を伴うことが多い。reflect on よりカジュアルで日常的。",
    example: "When I look back on my school days, I wish I had studied harder.",
    example_translation: "学生時代を振り返ると、もっと勉強すればよかったと思います。",
    cefr_level: "A2",
    why_hard_for_japanese: "「振り返る」を「look back」と表現するビジュアルメタファーが直感的でなく、「think about the past」などと言いがちになる。",
  },
  {
    expression: "think of",
    transcriptHighlight: "think about",
    type: "phrasal_verb",
    context: "Think of something you've always wanted to try. Small, sustainable changes are easier to think of than big ones.",
    context_translation: "ずっとやってみたかったことを思い浮かべてください。小さく持続可能な変化の方が、大きなものより思いつきやすいです。",
    meaning_ja: "〜を思いつく、〜を考え出す",
    nuance: "「think about」が「について考える（継続的プロセス）」なのに対し、「think of」は「ふと思いつく・頭に浮かぶ」瞬間的なアイデアや記憶に使う。",
    example: "I can't think of a better way to spend a Sunday afternoon.",
    example_translation: "日曜日の午後をこれ以上良い過ごし方で過ごすことは思いつきません。",
    cefr_level: "A2",
    why_hard_for_japanese: "think about との使い分けが難しく、「思いつく」という瞬間的な発想を表すときに think of を選べない学習者が多い。",
  },
];

const MATT_CUTTS_TRANSCRIPT = `Is there something you've always wanted to try? Think about something you've always wanted to add to your life and try it for the next 30 days.

The next 30 days are going to pass whether you like it or not, so why not think about something you have always wanted to try and give it a shot? For the next 30 days, try adding one new thing each day.

I decided to try something new every month. I wrote a novel in 30 days. I took a picture every day for a month. These small sustainable changes were not that hard. The months when I stuck with my goals were much more memorable than the months I didn't.

When I look back on the last 10 years, the periods of my life when I had 30-day challenges were the most memorable. So here's my question to you: what are you waiting for? I dare you to do something new for the next 30 days.`;

// ─────────────────────────────────────────────────────────────────────────────

const MALALA_PHRASES: PhraseResult[] = [
  {
    expression: "speak up",
    type: "phrasal_verb",
    context: "They thought that the bullets would silence us, but they failed. Out of that silence came thousands of voices. The terrorists failed to stop us and today we speak up.",
    context_translation: "彼らは銃弾が私たちを沈黙させると思っていた。しかし失敗した。その沈黙の中から何千もの声が生まれた。テロリストたちは私たちを止めることができず、今日私たちは声を上げる。",
    meaning_ja: "声を上げる、はっきりと意見を言う",
    nuance: "黙っていた状況から声を発すること。特に不正・不平等に対して勇気を持って発言するニュアンスが強い。",
    example: "If you see something unfair, you have to speak up.",
    example_translation: "不公平なことを見たら、声を上げなければなりません。",
    cefr_level: "B1",
    why_hard_for_japanese: "「発言する（speak）」は知っていても、「声を上げる・意見を言う」という比喩的な speak up を能動的に使えない学習者が多い。",
  },
  {
    expression: "give up",
    type: "phrasal_verb",
    context: "The terrorists thought that they would change my aims and stop my ambitions, but nothing changed in my life except this: weakness, fear, and hopelessness died. Strength, power, and courage was born. I do not want revenge. I do not want to see the Talib children deprived of education. I do not give up.",
    context_translation: "テロリストたちは私の目標を変え、野望を止めさせようとした。しかし、私の人生で変わったのはこれだけだ：弱さ、恐怖、絶望が死に、強さ、力、勇気が生まれた。私は復讐を求めない。私は諦めない。",
    meaning_ja: "諦める、やめる",
    nuance: "努力や挑戦を途中で放棄すること。Malalaの文脈では否定形で「決して諦めない」という強い意志を表している。日常会話でも最もよく使われる句動詞の一つ。",
    example: "No matter how difficult it gets, don't give up on your dreams.",
    example_translation: "どんなに大変でも、夢を諦めないでください。",
    cefr_level: "A1",
    why_hard_for_japanese: "カタカナ語「ギブアップ」として知られているが、「give up on 〜」の形や自然な使い方が定着しにくい。",
  },
  {
    expression: "stand up for",
    type: "phrasal_verb",
    context: "I raise up my voice — not so that I can shout, but so that those without a voice can be heard. We cannot all succeed when half of us are held back. We must stand up for education.",
    context_translation: "私が声を上げるのは叫ぶためではなく、声を持たない人たちが聞こえるようにするためだ。半数の人が抑えられていては、全員が成功することはできない。私たちは教育のために立ち上がらなければならない。",
    meaning_ja: "〜のために立ち上がる、〜を擁護する",
    nuance: "信念・権利・弱者のために積極的に行動・発言すること。単なる「支持（support）」より能動的で、困難を前にしても主張し続けるニュアンスがある。",
    example: "We need to stand up for children's rights to education.",
    example_translation: "子どもたちの教育を受ける権利のために立ち上がる必要があります。",
    cefr_level: "B1",
    why_hard_for_japanese: "「stand up」が物理的に立つイメージと結びつくため、「擁護・主張する」という比喩的な意味で自然に使うのが難しい。",
  },
  {
    expression: "believe in",
    type: "collocation",
    context: "I believe in education, peace, and equality for all. Let us believe in the power of education to change the world.",
    context_translation: "私はすべての人への教育、平和、平等を信じています。教育が世界を変える力を信じましょう。",
    meaning_ja: "〜を信じる、〜の価値・存在を信頼する",
    nuance: "「believe（事実として信じる）」と異なり、「believe in」は価値・理念・可能性・人物への信頼を表す。「〜の力・意義を信じる」という深い確信のニュアンス。",
    example: "You have to believe in yourself before others will believe in you.",
    example_translation: "他の人があなたを信じる前に、あなた自身が自分を信じなければなりません。",
    cefr_level: "A2",
    why_hard_for_japanese: "believe と believe in の使い分けが難しい。「God が存在すると信じる」は believe in God、「彼が言ったことを信じる」は believe him という違いを意識できない学習者が多い。",
  },
  {
    expression: "reach out",
    type: "phrasal_verb",
    context: "So let us wage a glorious struggle against illiteracy, poverty, and terrorism. Let us reach out for a brighter future where every child can go to school.",
    context_translation: "だから、非識字・貧困・テロリズムに対して輝かしい闘いを繰り広げましょう。すべての子どもが学校に通える明るい未来に向けて手を伸ばしましょう。",
    meaning_ja: "〜に手を伸ばす、連絡を取る、助けを求める",
    nuance: "物理的に手を伸ばす意味と、比喩的に「人に連絡する・支援を求める」意味の両方がある。Malalaの文脈では「より良い未来を目指して手を伸ばす」という希望の表現として使われている。",
    example: "Don't hesitate to reach out if you need any help.",
    example_translation: "助けが必要なときは、遠慮なく連絡してください。",
    cefr_level: "B1",
    why_hard_for_japanese: "物理的な「手を伸ばす」は理解できても、「連絡を取る・支援を求める」というビジネス・日常での比喩的用法を自然に使えない。",
    transcriptHighlight: "reach out for",
  },
  {
    expression: "pick up",
    type: "phrasal_verb",
    context: "Let us pick up our books and our pens. They are our most powerful weapons.",
    context_translation: "本とペンを手に取りましょう。それが私たちの最も強力な武器です。",
    meaning_ja: "〜を手に取る、拾い上げる",
    nuance: "物を「拾う・持ち上げる」という基本的な意味のほか、「（スキルなど）を習得する」「車で迎えに行く」など多義的に使われる最重要句動詞の一つ。",
    example: "Pick up a book and start reading — it's the best habit you can build.",
    example_translation: "本を手に取って読み始めてください。それが身につけられる最良の習慣です。",
    cefr_level: "A1",
    why_hard_for_japanese: "「拾う」という基本義は知っていても、「スキルを身につける」「車で迎える」などの派生義を文脈に合わせて使いこなすのが難しい。",
  },
];

const MALALA_TRANSCRIPT = `In the name of God, the most merciful, the most beneficent.

Today, it is an honor for me to be speaking again after a long time. Being here with such honorable people is a great moment in my life.

I don't know where to begin my speech. I don't know what people would be thinking right now — how strange it is to have a young girl stand up and talk.

They thought that the bullets would silence us. But they failed. Out of that silence came thousands of voices. The terrorists failed to stop us and today we speak up.

The terrorists thought that they would change my aims and stop my ambitions, but nothing changed in my life except this: weakness, fear and hopelessness died. Strength, power and courage was born.

I am the same Malala. My ambitions are the same. My hopes are the same. My dreams are the same.

I do not want revenge upon the Taliban or any terrorist group. I want education for the sons and daughters of all terrorists and extremists. I do not want to see the Talib children deprived of education. I do not give up.

I raise up my voice — not so that I can shout, but so that those without a voice can be heard. We cannot all succeed when half of us are held back. We must stand up for education.

I speak not for myself, but so those without a voice can be heard. Those who have fought for their rights: their right to live in peace, their right to be treated with dignity, their right to equality of opportunity, their right to be educated.

I believe in education, peace, and equality for all. Let us believe in the power of education to change the world.

So let us wage a glorious struggle against illiteracy, poverty, and terrorism. Let us reach out for a brighter future where every child can go to school.

Let us pick up our books and our pens. They are our most powerful weapons. One child, one teacher, one book and one pen can change the world. Education is the only solution.`;

// ─────────────────────────────────────────────────────────────────────────────

const MCGONIGAL_PHRASES: PhraseResult[] = [
  {
    expression: "make friends with",
    type: "idiom",
    context: "Today I want to try to persuade you to make stress your friend. The latest science suggests that stress may only be bad for you if you believe that stress is bad for you.",
    context_translation: "今日は、ストレスを友達にするよう説得したいと思います。最新の科学によれば、ストレスが有害になるのは、ストレスを有害だと信じている場合だけかもしれません。",
    meaning_ja: "〜と仲良くなる、〜を友達にする",
    nuance: "人だけでなく、状況・感情・習慣など抽象的なものを「友好的に受け入れる」意味でも使える。McGonigalの文脈では「ストレスを敵視せず受け入れる」という積極的な態度の比喩。",
    example: "Once I made friends with uncertainty, I started taking more risks.",
    example_translation: "不確実性と仲良くなってから、もっとリスクを取れるようになりました。",
    cefr_level: "A2",
    why_hard_for_japanese: "「友達を作る」は make friends だが、「make friends with 〜」で「〜と仲良くなる」という使い方が身についていない学習者が多い。",
  },
  {
    expression: "reach out to",
    type: "phrasal_verb",
    context: "The participants who spent time caring for others showed absolutely no stress-related health decline. When you choose to reach out to others under stress, you create resilience.",
    context_translation: "他者のケアに時間を使った参加者には、ストレスに関連した健康の悪化が一切見られませんでした。ストレス下で他者に手を差し伸べることを選ぶと、回復力が生まれます。",
    meaning_ja: "〜に手を差し伸べる、〜に連絡・支援をする",
    nuance: "助けを求めるだけでなく、自分から積極的に相手に接触・支援する姿勢を表す。ビジネスメールでも「ご連絡します」の意味で非常によく使われる。",
    example: "During tough times, reach out to the people you trust.",
    example_translation: "つらいときは、信頼できる人たちに手を差し伸べてください。",
    cefr_level: "B1",
    why_hard_for_japanese: "reach out（手を伸ばす）という物理的イメージから、「連絡する・支援する」という比喩的意味への転換が難しい。ビジネス英語では必須表現。",
  },
  {
    expression: "take on",
    type: "phrasal_verb",
    context: "When you view your stress response as helpful, you're brave. You're taking on a challenge rather than being overwhelmed by it.",
    context_translation: "ストレス反応を有益なものとして捉えると、あなたは勇敢になります。圧倒されるのではなく、挑戦に立ち向かっているのです。",
    meaning_ja: "〜に取り組む、〜を引き受ける、〜に立ち向かう",
    nuance: "困難・責任・挑戦を積極的に「引き受ける・受け入れる」ニュアンス。逃げずに向き合う姿勢を示す際に使う。「take on a challenge」は特に頻出の表現。",
    example: "She decided to take on the most difficult project in the company.",
    example_translation: "彼女は会社で最も難しいプロジェクトを引き受けることにしました。",
    cefr_level: "B1",
    why_hard_for_japanese: "「取り組む（work on）」は使えても、「挑戦を受け入れる・引き受ける」という積極的姿勢を表す take on を適切に使えない学習者が多い。",
  },
  {
    expression: "turn to",
    type: "phrasal_verb",
    context: "When life is difficult, your stress response wants you to be surrounded by people who care about you. So when you're stressed, turn to the people around you.",
    context_translation: "人生が辛いとき、ストレス反応はあなたを気にかけてくれる人々に囲まれることを望んでいます。だからストレスを感じたとき、周りの人に頼りましょう。",
    meaning_ja: "〜に頼る、〜に助けを求める",
    nuance: "助けや解決策を求めて特定の人・物・方法に向かうこと。「depend on（依存する）」より一時的・能動的なニュアンスがある。",
    example: "Whenever I feel lost, I turn to my mentor for advice.",
    example_translation: "迷ったときはいつも、メンターに相談します。",
    cefr_level: "B1",
    why_hard_for_japanese: "「頼る（rely on / depend on）」との使い分けが難しい。turn to は「その人のもとへ向かう・相談に行く」という能動的な行動を表す。",
  },
  {
    expression: "be associated with",
    type: "collocation",
    context: "People who spent time caring for others showed no stress-related health decline, even though they had the same life stress. Stress was not associated with dying when people spent time helping.",
    context_translation: "他者のケアに時間を使った人々は、同じ人生のストレスを抱えていても、ストレス関連の健康悪化が見られませんでした。助けに時間を使うとき、ストレスは死亡と関連していませんでした。",
    meaning_ja: "〜と関連している、〜と結びついている",
    nuance: "2つの事柄の間に相関・関係があることを示す。科学・研究・医療の文脈で頻繁に使われる表現。「connected to」より客観的でアカデミックなニュアンス。",
    example: "Heavy screen time is often associated with poor sleep quality.",
    example_translation: "長時間のスクリーン使用はしばしば睡眠の質の低下と関連しています。",
    cefr_level: "B2",
    why_hard_for_japanese: "受動態の形（be associated with）での使い方が日本語話者には不自然で、「関係がある」を使ったシンプルな表現に言い換えてしまいがちになる。",
  },
  {
    expression: "make sense of",
    type: "idiom",
    context: "Our minds are incredibly good at making sense of whatever information we give them. Choose to believe that stress is helpful, and your body will follow.",
    context_translation: "私たちの心は、与えられた情報を理解・処理することが非常に得意です。ストレスが助けになると信じることを選べば、体もそれに従います。",
    meaning_ja: "〜を理解する、〜に意味を見出す",
    nuance: "複雑・混乱した状況や情報を整理して「意味のあるものとして理解する」プロセスを表す。「understand」より「頭を働かせて解釈する」ニュアンスが強い。",
    example: "It took me years to make sense of everything that had happened.",
    example_translation: "起きたことすべてを理解するのに何年もかかりました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「make sense（意味をなす）」は知っていても、「make sense of 〜（〜を理解する）」という他動詞的用法を自然に使えない学習者が多い。",
  },
];

const MCGONIGAL_TRANSCRIPT = `I have a confession to make. But first, I want you to make a little confession to me.

In the past year, I want you to just raise your hand if you've experienced relatively little stress. Now I want you to raise your hand if you've experienced a lot of stress.

Now look at me. I am committed to science, and I have been tracking stress-health data for years. The old belief? Stress is harmful. Avoid it.

But I've changed my mind about stress. Today, I want to try to persuade you to make friends with stress — to treat it as an ally rather than an enemy.

Here's the key insight: stress makes you social. When you view your stress response as helpful — your heart is pounding, you might be breathing faster — you can actually change your body's response.

People who spent time caring for others showed absolutely no stress-related health decline. Importantly, stress was not associated with dying in people who spent time helping others. Chasing meaning is better for your health than trying to avoid discomfort. When you choose to reach out to others under stress — when you take on challenges rather than avoiding them — you create resilience.

Our minds are incredibly good at making sense of whatever information we give them. Choose to believe that stress is helpful, and your body will follow.

So next time your heart is pounding, think: this is my body helping me rise to this challenge. Turn to the people around you and tell them: I've got this.`;

// ─────────────────────────────────────────────────────────────────────────────

const ACHOR_PHRASES: PhraseResult[] = [
  {
    expression: "scan for",
    type: "collocation",
    context: "We've wired our brains to be negative. If I asked you to scan this room for all the things that are brown, you'd start scanning for brown. Our brains work the same way with happiness.",
    context_translation: "私たちは脳をネガティブになるように配線してしまっています。この部屋で茶色いものを探してと言ったら、あなたは茶色を探し始めるでしょう。脳は幸福についても同じように働きます。",
    meaning_ja: "〜を探してざっと見渡す、〜をスキャンする",
    nuance: "特定のものを見つけるために素早く視野・情報を検索するイメージ。コンピューター・セキュリティ分野だけでなく、「注意を向ける方向性」という心理的な意味でも使われる。",
    example: "Instead of scanning for problems, try scanning for opportunities.",
    example_translation: "問題を探す代わりに、機会を探してみてください。",
    cefr_level: "B1",
    why_hard_for_japanese: "技術的な「スキャン」は馴染みがあるが、「〜を探して注意を向ける」という比喩的・認知的な意味での scan for は日本語に対応する表現がなく使いにくい。",
  },
  {
    expression: "give back",
    type: "phrasal_verb",
    context: "One of the biggest drivers of success is social connection. Spend time giving back to others — even two minutes of journaling about a positive experience can rewire your brain.",
    context_translation: "成功の最大の原動力の一つは社会的なつながりです。他者に還元する時間を持ちましょう。ポジティブな経験について2分間日記を書くだけでも、脳を再配線できます。",
    meaning_ja: "恩返しする、社会に貢献する、還元する",
    nuance: "受け取ったもの（恩恵・知識・機会など）を社会や他者に返す行為。ボランティア・慈善活動・メンタリングなど広い文脈で使われる。",
    example: "She volunteers every weekend as a way to give back to her community.",
    example_translation: "彼女は地域社会に恩返しするために毎週末ボランティアをしています。",
    cefr_level: "A2",
    why_hard_for_japanese: "「返す（give back）」という物理的な意味は分かっても、「社会に貢献する・恩返しをする」という抽象的な意味での使い方が定着しにくい。",
  },
  {
    expression: "write down",
    type: "phrasal_verb",
    context: "Every morning, write down three new things you are grateful for. This trains your brain to scan for the positive first.",
    context_translation: "毎朝、感謝していること3つを書き留めてください。これにより脳がまずポジティブなものを探すよう訓練されます。",
    meaning_ja: "書き留める、書き出す",
    nuance: "単に「書く」ではなく、後で参照・記録するために意識的に書き残すイメージ。思考を整理したり習慣化するための行為として使われる。",
    example: "Write down your three biggest goals and review them every morning.",
    example_translation: "最大の目標を3つ書き出して、毎朝確認してください。",
    cefr_level: "A1",
    why_hard_for_japanese: "「書く」を write だけで表現しようとし、「書き留める・書き出す」という記録の意図を持つ write down を使わない学習者が多い。",
  },
  {
    expression: "focus on",
    type: "collocation",
    context: "Every day, if you focus on one positive experience from the past 24 hours and write about it in detail, your brain starts to relive it.",
    context_translation: "毎日、過去24時間のポジティブな経験の一つに集中して詳しく書くと、脳はそれを再体験し始めます。",
    meaning_ja: "〜に集中する、〜に焦点を当てる",
    nuance: "注意・エネルギー・思考を特定の対象に向けること。concentrate on よりカジュアルで日常的。目標・問題・解決策など多様な対象に使える。",
    example: "Try to focus on what you can control, not what you can't.",
    example_translation: "コントロールできることに集中して、できないことは気にしないようにしましょう。",
    cefr_level: "A2",
    why_hard_for_japanese: "「集中する」の意味は分かっていても、focus on の後に続く表現のバリエーションが少ない学習者が多い。",
  },
  {
    expression: "keep up with",
    type: "phrasal_verb",
    context: "It is not enough to just work hard. You have to keep up with the positive changes, otherwise your brain reverts to its old patterns.",
    context_translation: "ただ一生懸命働くだけでは不十分です。ポジティブな変化について行かなければ、脳は以前のパターンに戻ってしまいます。",
    meaning_ja: "〜についていく、〜に遅れずについていく",
    nuance: "変化・速度・要求に追いつき続けること。follow（ついていく）より「努力してペースを維持する」意味が強い。テクノロジー・仕事・流行など多様な文脈で頻出。",
    example: "It's hard to keep up with all the changes in technology these days.",
    example_translation: "最近は技術の変化すべてに追いついていくのが大変です。",
    cefr_level: "B1",
    why_hard_for_japanese: "「keep up（維持する）」という動詞と「with（〜について）」の組み合わせが直感的でなく、「追いつく catch up」と混同されることも多い。",
  },
  {
    expression: "miss out on",
    type: "phrasal_verb",
    context: "If you wait to be happy until you are successful, you will miss out on 90% of your life. Happiness is not the belief that we don't need to change; it is the belief that change is possible.",
    context_translation: "成功するまで幸せを待っていたら、人生の90%を逃してしまいます。幸福とは変化が不要だという信念ではなく、変化が可能だという信念です。",
    meaning_ja: "〜を逃す、〜の機会を失う",
    nuance: "良い経験・機会・楽しみを「見逃す・経験できない」ことを表す。後悔のニュアンスを含むことが多く、FOMO（見逃し恐怖）の文脈でも頻繁に使われる。",
    example: "If you spend all your time working, you'll miss out on the important moments in life.",
    example_translation: "ずっと仕事ばかりしていると、人生の大切な瞬間を逃してしまいます。",
    cefr_level: "B1",
    why_hard_for_japanese: "「miss（逃す）」は知っていても、「miss out on」という3語の組み合わせを使いこなすのが難しく、「I missed it」などと短縮してしまいがち。",
  },
];

const ACHOR_TRANSCRIPT = `When I was seven years old, my sister fell off the top bunk bed. As she was crying, I knew she would tell our parents what happened. So I told her it was a magical experience. She believed me.

That's the power of positive psychology.

For the past decade, I have been studying what makes people happy. Here's what I found: we've got the formula for success completely backwards.

We think: "If I work harder, I'll be more successful. If I'm more successful, then I'll be happy." This is backwards. Every time your brain experiences success, you just move the goalposts. If happiness is on the other side of success, your brain never gets there.

The greatest advantage that I have found is a positive brain. Happiness raises every business and educational outcome.

So here is the formula: if you spend just two minutes every day writing down three new things you're grateful for, your brain starts to scan for the positive instead of the negative. Write down one positive experience from the past 24 hours. If you focus on one positive thing each day and write about it in detail, your brain starts to relive it.

It is not enough to just feel good once. You have to keep up with these positive habits every single day. Exercise. Meditate. Do random acts of kindness.

Give back — help someone else. Reach out to someone who needs it.

Because success does not bring happiness. But a positive brain leads to greater success. And if you miss out on happiness now, you miss out on 90% of your life.`;

// ─────────────────────────────────────────────────────────────────────────────

const ROBINSON_PHRASES: PhraseResult[] = [
  {
    expression: "come alive",
    type: "idiom",
    context: "The real role of education is to inspire and to awaken, not to produce factory workers. When children come alive in a subject, they can achieve anything.",
    context_translation: "教育の本当の役割は、鼓舞し目覚めさせることであって、工場労働者を生産することではありません。子どもたちがある教科に生き生きとなれば、何でも達成できます。",
    meaning_ja: "生き生きとする、活気づく、本領を発揮する",
    nuance: "人が情熱・興味・活力を取り戻してエネルギッシュになること。「become enthusiastic」より感情的・視覚的で、その人の本質が輝き出すイメージ。",
    example: "She really comes alive when she talks about music.",
    example_translation: "彼女は音楽の話をするとき、本当に生き生きとします。",
    cefr_level: "B2",
    why_hard_for_japanese: "「come（来る）＋ alive（生きた）」という組み合わせから「生き生きする」という意味が直感的に読めない。比喩的な生命感を表す表現として意識的に習得が必要。",
  },
  {
    expression: "make the most of",
    type: "idiom",
    context: "We have to make the most of our children's talents. Every child has different gifts, and it's our job to help them discover and develop them.",
    context_translation: "私たちは子どもたちの才能を最大限に活かさなければなりません。すべての子どもは異なる才能を持っており、それを発見・育てる手助けをするのが私たちの仕事です。",
    meaning_ja: "〜を最大限に活用する、〜を活かしきる",
    nuance: "持っているもの（時間・機会・才能）を無駄にせず最大限に使うこと。「use effectively」より「もったいなくしない」というニュアンスがある。",
    example: "Make the most of every opportunity you get — they don't come twice.",
    example_translation: "すべての機会を最大限に活かしてください――二度は来ません。",
    cefr_level: "B1",
    why_hard_for_japanese: "「最大限に活用する」を maximize や use well と言いがちで、「make the most of」というイディオムを自然に使えない学習者が多い。",
  },
  {
    expression: "run with",
    type: "phrasal_verb",
    context: "If you give children an idea and you let them run with it, the results are extraordinary. Creativity is not a linear process.",
    context_translation: "子どもたちにアイデアを与えて自由に展開させると、その結果は素晴らしいものになります。創造性は直線的なプロセスではありません。",
    meaning_ja: "〜を積極的に展開する、〜に乗って突き進む",
    nuance: "アイデア・計画・提案を受け取ってそれを自分なりに発展・拡張させること。「develop」より「乗り気になって突き進む」エネルギッシュなニュアンスがある。",
    example: "I gave her the basic concept and she ran with it, turning it into something amazing.",
    example_translation: "基本的なコンセプトを渡したら、彼女はそれを積極的に展開して素晴らしいものに変えた。",
    cefr_level: "B2",
    why_hard_for_japanese: "「run（走る）」という物理的イメージと「アイデアを展開する」という比喩的意味の結びつきが直感的でなく、この用法を知らない学習者が多い。",
  },
  {
    expression: "be stigmatized",
    type: "collocation",
    context: "We are now running national education systems where mistakes are the worst things you can make. Students who make mistakes are stigmatized, and so people are frightened of being wrong.",
    context_translation: "私たちは今、間違いが最悪のことであるような国家教育システムを運営しています。間違いを犯す学生は烙印を押され、人々は間違いを恐れるようになっています。",
    meaning_ja: "烙印を押される、汚名を着せられる",
    nuance: "社会的に否定的なレッテルや恥を負わされること。「stigma（烙印・汚名）」から派生した表現で、精神疾患・犯罪・失敗など「タブー視されてきたもの」の文脈で頻用される。",
    example: "Mental health issues are still stigmatized in many workplaces.",
    example_translation: "精神的な健康問題は、多くの職場でまだ烙印を押されています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「stigma（スティグマ）」自体が専門的なため、「烙印を押される」という概念を英語で表現する語彙として習得するのに意識的な努力が必要。",
    transcriptHighlight: "stigmatized",
  },
  {
    expression: "grow out of",
    type: "phrasal_verb",
    context: "We have a system of education that was designed and conceived in a different age. It was built for an intellectual model that came out of the Enlightenment and grew out of the needs of industrialism.",
    context_translation: "私たちは別の時代に設計・構想された教育システムを持っています。それは啓蒙主義から生まれた知的モデルで、産業主義のニーズから生まれたものです。",
    meaning_ja: "〜から発展・生まれた、（子どもが）大きくなって〜ができなくなる",
    nuance: "2つの意味がある重要な句動詞。①子どもが成長して服・習慣・趣味が合わなくなる、②ある状況・背景から自然に発展・生まれる。文脈によって判断が必要。",
    example: "Many of today's technologies grew out of military research.",
    example_translation: "今日の多くのテクノロジーは軍事研究から発展したものです。",
    cefr_level: "B2",
    why_hard_for_japanese: "「grow（育つ）+ out of（〜から外へ）」という組み合わせから複数の意味が派生していることを知らないと、文脈によって意味を取り違えやすい。",
    transcriptHighlight: "grew out of",
  },
  {
    expression: "be educated out of",
    type: "grammar_pattern",
    context: "Picasso once said that all children are born artists. The problem is to remain an artist as we grow up. I believe this passionately: we don't grow into creativity, we get educated out of it.",
    context_translation: "ピカソはかつて言いました。すべての子どもはアーティストとして生まれる、と。問題は大人になってもアーティストであり続けることです。私はこう強く信じています：私たちは創造性の中へ成長するのではなく、教育によって創造性から追い出されるのだ、と。",
    meaning_ja: "教育によって〜の能力・感覚を失う",
    nuance: "「be educated out of creativity」＝「教育を受けることで創造性を失う」という逆説的な表現。be + V-ed + out of で「〜することで〜から追い出される」という構文。",
    example: "Many children are educated out of their natural curiosity by the time they finish school.",
    example_translation: "多くの子どもたちは、学校を卒業するころには教育によって生まれ持った好奇心を失っています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「educate（教育する）」がネガティブな結果と結びつく逆説的な構造が日本語話者には異質で、この構文パターンを能動的に使えるようになるには深い習熟が必要。",
  },
];

const ROBINSON_TRANSCRIPT = `Good morning. How are you? It's been great, hasn't it? I've been blown away by the whole thing.

My theme is this: human communities depend upon a diversity of talent, not a single conception of ability. At the heart of the challenge is to reconstitute our sense of ability and of intelligence.

This is a story about creativity. I believe our only hope for the future is to adopt a new conception of human ecology, one in which we start to reconstitute our concept of the richness of human capacity.

All children are born with a natural talent to learn and a deep passion to discover. We are educating people out of their creativity. We don't grow into creativity, we get educated out of it.

Shakespeare, when he was a child, was somebody's child. He was once in a class thinking, "this is boring." We take it for granted. Epictetus — somebody's child, growing up in poverty, becoming one of the great minds.

My contention is that creativity is as important as literacy. And we should treat it with the same status. Children come alive in subjects that connect to their own intelligence. Make the most of that spark.

The great problem we face is that this system was designed in a different age — for a different world. It was built to meet the needs of industrialism, and grew out of the intellectual culture of the Enlightenment. Students who make mistakes are stigmatized, and so people become frightened of being wrong. The most successful education systems in the world don't treat students uniformly; they treat them as full human beings. Run with their ideas. Let them come alive.`;

// ─────────────────────────────────────────────────────────────────────────────

const BRENE_BROWN_PHRASES: PhraseResult[] = [
  {
    expression: "open up",
    type: "phrasal_verb",
    context: "The people who had a strong sense of love and belonging simply believed they were worthy of love. They had the courage to be vulnerable. They were willing to open up about who they were.",
    context_translation: "愛と帰属感を強く持っている人たちは、自分が愛されるに値すると単純に信じていました。彼らは傷つく勇気を持っていた。自分自身について心を開く意欲があった。",
    meaning_ja: "心を開く、打ち明ける",
    nuance: "感情・秘密・悩みなどを他者に開示すること。物理的に「開ける」意味の他、感情的に「ガードを下げて本音を話す」という比喩的意味で非常によく使われる。",
    example: "It took her months to open up about what she was going through.",
    example_translation: "自分が経験していることについて心を開くまで、彼女には数か月かかりました。",
    cefr_level: "B1",
    why_hard_for_japanese: "「話す（talk）」や「打ち明ける（confess）」は使えても、「感情的なガードを下げて本音を開示する」ニュアンスを持つ open up を使いこなせない学習者が多い。",
  },
  {
    expression: "hold back",
    type: "phrasal_verb",
    context: "What made them vulnerable also made them beautiful. They didn't hold back. They didn't let fear of being hurt prevent them from connecting.",
    context_translation: "彼らを傷つきやすくしたものが、彼らを美しくもしていました。彼らは自分を抑えませんでした。傷つくことへの恐怖が人とつながることを妨げるのを許しませんでした。",
    meaning_ja: "〜を抑える、〜を控える、自分を押さえ込む",
    nuance: "感情・行動・情報などを意識的に表に出さないこと。「suppress（抑圧する）」よりカジュアルで、感情・才能・発言を自分から「引っ込める」ニュアンスがある。",
    example: "Don't hold back — tell me exactly how you feel.",
    example_translation: "遠慮しないで――どう感じているか正直に教えてください。",
    cefr_level: "B1",
    why_hard_for_japanese: "「hold（持つ・保つ）+ back（後ろへ）」から「抑える」という意味が直感的に読めない。感情表現の場面で自然に使えるようになるまで練習が必要。",
  },
  {
    expression: "numb out",
    type: "phrasal_verb",
    context: "We cannot selectively numb emotion. When we numb the dark emotions, we numb joy. We numb gratitude. We numb happiness.",
    context_translation: "感情を選択的に麻痺させることはできません。暗い感情を麻痺させると、喜びも麻痺させてしまいます。感謝も、幸福も麻痺させてしまいます。",
    meaning_ja: "感覚・感情を麻痺させる、無感覚にする",
    nuance: "痛みや不快な感情から逃げるために心を閉じること。アルコール・ SNS・過食などで感情から逃避する行動を指すこともある。「shut down」より感覚レベルでの麻痺を強調。",
    example: "Some people numb out their anxiety with constant distraction.",
    example_translation: "絶え間ない気晴らしで不安を麻痺させる人もいます。",
    cefr_level: "B2",
    why_hard_for_japanese: "「numb（麻痺した・感覚がない）」という形容詞は知っていても、「numb out」という動詞句として感情的な文脈で使う用法を知らない学習者が多い。",
  },
  {
    expression: "let go of",
    type: "phrasal_verb",
    context: "Connection is why we're here. But in order to connect, we have to let go of who we think we should be and allow ourselves to be who we are.",
    context_translation: "つながりこそが私たちがここにいる理由です。しかしつながるためには、自分がこうあるべきだという考えを手放し、自分自身であることを許す必要があります。",
    meaning_ja: "〜を手放す、〜を諦める、〜にこだわるのをやめる",
    nuance: "物理的に「放す」意味のほか、執着・思い込み・感情・過去などを精神的に「手放す」という深い意味でも使われる。心理学・スピリチュアル系の文脈で特によく登場する。",
    example: "Learning to let go of perfectionism was the best thing I ever did.",
    example_translation: "完璧主義を手放すことを学んだのは、私がしたことで最高のことでした。",
    cefr_level: "B1",
    why_hard_for_japanese: "「let go（手を放す）」の物理的意味から「執着・こだわりを手放す」という比喩的意味への転換が難しく、感情的な文脈でも使えるよう意識的に習得する必要がある。",
  },
  {
    expression: "be worthy of",
    type: "collocation",
    context: "What separated the people who had a strong sense of love and belonging from those who didn't was simply this: they believed they were worthy of love.",
    context_translation: "愛と帰属感を強く持つ人とそうでない人を分けたのは、ただこれだけでした：自分が愛されるに値すると信じていたこと。",
    meaning_ja: "〜に値する、〜にふさわしい",
    nuance: "価値・資格・資質を持っていること。「deserve（受けるに値する）」と似ているが、be worthy of は内面的な「ふさわしさ・尊厳」に焦点を当てる。自己肯定感・尊厳の文脈で重要。",
    example: "Every person is worthy of respect and dignity.",
    example_translation: "すべての人は尊重と尊厳に値します。",
    cefr_level: "B2",
    why_hard_for_japanese: "「worthy（価値のある）」という単語自体が日常的でないため、「be worthy of 〜」という形で使いこなせるようになるには意識的な練習が必要。",
    transcriptHighlight: "worthy of",
  },
  {
    expression: "whole-heartedly",
    type: "collocation",
    context: "The people who had a strong sense of love and belonging believed they were worthy. They embraced vulnerability. They loved whole-heartedly, even though there was no guarantee.",
    context_translation: "愛と帰属感を強く持つ人たちは、自分がそれに値すると信じていました。脆弱性を受け入れていました。保証がなくても、全力で愛しました。",
    meaning_ja: "心から、全力で、誠実に",
    nuance: "「全身全霊で・躊躇なく・本気で」というニュアンス。partially（部分的に）の対義語として、完全な関与・熱意を表す副詞。行動だけでなく、感情・信念にも使える。",
    example: "I believe whole-heartedly that education can change a person's life.",
    example_translation: "教育が人の人生を変えられると、私は心から信じています。",
    cefr_level: "B2",
    why_hard_for_japanese: "「whole heart（全心）」から「全力で」という副詞的意味への転換が直感的でなく、「completely」や「truly」で代替してしまいがちな表現。",
  },
];

const BRENE_BROWN_TRANSCRIPT = `So I'll start with this: a couple years ago, an event planner called me because I was going to do a speaking event. She said, "I've been reading your information, and I have a couple of questions for you." I thought, "Oh, this will be fine."

She said, "I'm a little confused about how you describe yourself on your website." I said, "Okay." And she said, "You describe yourself as a researcher and a storyteller." And I said, "Yes." She said, "How does that work?"

I study vulnerability. I study shame, fear, and our struggle for worthiness. But I was surprised that the #1 thing that came up was connection — our ability to connect.

After six years, I had a breakdown. Because I had found that vulnerability — the willingness to say "I love you" first, to do something where there are no guarantees — is the birthplace of joy, creativity, belonging, and love.

The people who had a strong sense of love and belonging simply believed they were worthy of love. They had the courage to be imperfect. They let go of who they thought they should be in order to be who they were.

They didn't hold back. They opened up. They loved whole-heartedly, even though there was no guarantee.

We cannot selectively numb out emotion. When we try to numb out the dark emotions, we also numb joy, gratitude, happiness.

Here's what I've learned: we are worthy of love and belonging. Let go of who you think you should be, and embrace who you are.`;

// ─────────────────────────────────────────────────────────────────────────────

const CUDDY_PHRASES: PhraseResult[] = [
  {
    expression: "take up space",
    type: "collocation",
    context: "When we feel powerful, we expand. We take up space. But when we feel powerless, we make ourselves small. We close up.",
    context_translation: "力強いと感じるとき、私たちは広がります。空間を占領します。しかし無力感を感じるとき、私たちは自分を小さくします。閉じてしまいます。",
    meaning_ja: "場所を占める、存在感を示す",
    nuance: "物理的に空間を使うことの他、「自分の存在・意見・権利を主張する」という比喩的意味でも使われる。身体的な自信表現（パワーポーズ）の文脈で特に重要。",
    example: "Don't be afraid to take up space in the room — your presence matters.",
    example_translation: "その場で存在感を示すことを恐れないでください――あなたの存在は重要です。",
    cefr_level: "B1",
    why_hard_for_japanese: "「空間を取る」という物理的表現から「存在感を示す・主張する」という比喩的意味への転換が難しい。自信表現に関連した文脈で使えるよう習得が必要。",
  },
  {
    expression: "come across as",
    type: "phrasal_verb",
    context: "Tiny tweaks to body language can make a big difference. How you come across to others affects how they perceive you, and ultimately how you feel about yourself.",
    context_translation: "ボディランゲージのちょっとした調整が大きな違いを生みます。あなたが他者にどう見えるかが、彼らのあなたへの認識に影響し、最終的にはあなた自身の感じ方にも影響します。",
    meaning_ja: "〜という印象を与える、〜に見える",
    nuance: "意図とは関係なく、外から見てどう映るかという「他者の印象」を表す。「seem」や「appear」より「実際の印象・評価」というニュアンスがやや強い。",
    example: "Try not to come across as nervous in your job interview.",
    example_translation: "就職面接では緊張しているように見えないようにしましょう。",
    cefr_level: "B2",
    why_hard_for_japanese: "「come across（出会う）」という基本的意味から「印象を与える」という用法への転換が難しく、seem / look で代替してしまいがちな表現。",
  },
  {
    expression: "fake it till you make it",
    type: "idiom",
    context: "So I want to offer you a free, no-tech life hack. And the only catch is that it requires a little bit of courage. Fake it till you make it.",
    context_translation: "そこで無料でテクノロジー不要の人生ハックを提案します。唯一の条件は少しの勇気が必要なこと。なりきるうちに本物になる。",
    meaning_ja: "なりきるうちに本物になる、自信があるふりをしているうちに本当の自信がつく",
    nuance: "自信がなくても自信があるように振る舞い続けることで、やがて本当に自信が育つというモチベーション系の定番フレーズ。職場・プレゼン・新しい環境など幅広い文脈で使われる。",
    example: "When I started my new job, I just had to fake it till I made it.",
    example_translation: "新しい仕事を始めたとき、なりきるうちに本物になるしかありませんでした。",
    cefr_level: "B1",
    why_hard_for_japanese: "意味は分かっても「fake（偽る）」という表現を肯定的な文脈で使うことに違和感を感じる学習者が多い。また「till you make it」の make it が何を意味するかも理解が必要。",
    transcriptHighlight: "fake it till you become it",
  },
  {
    expression: "carry out",
    type: "phrasal_verb",
    context: "We carried out a study to see how body language affects the way we feel. People who carried out high-power poses showed significant hormonal changes.",
    context_translation: "ボディランゲージが感じ方に与える影響を調べる研究を実施しました。ハイパワーポーズをとった人たちには、有意なホルモン変化が見られました。",
    meaning_ja: "〜を実施する、〜を遂行する",
    nuance: "計画・実験・調査・命令などを実際に行うこと。「do」より正式・計画的で、「execute」よりカジュアル。研究・実験の文脈では特によく使われる。",
    example: "The team carried out a series of tests before launching the product.",
    example_translation: "チームは製品を発売する前に一連のテストを実施しました。",
    cefr_level: "B1",
    why_hard_for_japanese: "「carry（運ぶ）+ out（外へ）」から「実施する」という意味が連想しにくい。perform / conduct / implement と意味が重なるため、使い分けに迷う学習者が多い。",
    transcriptHighlight: "carried out",
  },
  {
    expression: "back up",
    type: "phrasal_verb",
    context: "These findings are backed up by research in animals and primates. When they feel dominant, they expand. The research backs up what we see in the real world.",
    context_translation: "これらの発見は、動物や霊長類の研究によって裏付けられています。支配的と感じるとき、彼らは広がります。研究は現実世界で見られることを裏付けています。",
    meaning_ja: "〜を裏付ける、〜を支持する",
    nuance: "証拠・データ・研究が主張・仮説を支持すること。「support」よりやや口語的で、「確認・強化する」ニュアンスがある。バックアップデータの「backup」とも関連。",
    example: "The theory is backed up by years of scientific research.",
    example_translation: "その理論は何年もの科学的研究によって裏付けられています。",
    cefr_level: "B1",
    why_hard_for_japanese: "「バックアップ（backup）」はITで馴染みがあるが、「裏付ける・支持する」という動詞句「back up」を研究・議論の文脈で使いこなすのは別の習得が必要。",
  },
  {
    expression: "configure",
    type: "collocation",
    context: "Our bodies change our minds. Before a high-stakes social situation, configure your body to be powerful. Two minutes of power posing can change the outcome.",
    context_translation: "体が心を変えます。重要な社会的場面の前に、力強くなるよう体を整えてください。2分間のパワーポーズが結果を変えることができます。",
    meaning_ja: "〜を設定する、〜を構成する、〜を整える",
    nuance: "主にコンピュータ・機器の「設定・構成」を意味するが、Cuddyは「体を意図的に整える・設定する」という比喩的用法で使っている。アカデミックな文脈でも使われる。",
    example: "Configure your workspace to support deep, focused work.",
    example_translation: "深い集中した作業をサポートするように作業スペースを整えてください。",
    cefr_level: "B2",
    why_hard_for_japanese: "「configure（設定する）」はIT用語として知られているが、「自分の体や環境を整える」という比喩的な使い方に転用できるよう意識的に習得する必要がある。",
  },
];

const CUDDY_TRANSCRIPT = `So I want to ask you to think about the last time you were in a high-stakes social situation. Maybe a job interview. Meeting your partner's parents. An important presentation.

Nonverbal behavior is incredibly powerful. We know that we judge others based on their body language. And in turn, our own body language shapes who we are.

When we feel powerful, we expand. We open up. We take up space. When we feel powerless, we close up.

Here's what's fascinating: our bodies can actually change our minds. In two minutes, your body can change your mental state.

We carried out an experiment. People posed in high-power positions — open, expansive, taking up space — or low-power positions, for two minutes. The people who held high-power poses felt more powerful, performed better under pressure, and took more risks. These findings are backed up by research in animals and primates as well.

So this is what I'm saying to you: before that next big presentation or interview, go to a bathroom stall and stand in a power pose for two minutes. Configure your body to be powerful. Don't fake it till you make it. Fake it till you become it.

Because your body is listening to your mind. And your mind is listening to your body. Two minutes. Try it. Come across as the best version of yourself.`;

// ─────────────────────────────────────────────────────────────────────────────

const GILBERT_PHRASES: PhraseResult[] = [
  {
    expression: "show up",
    type: "phrasal_verb",
    context: "Your job is to show up and do your work, regardless of the outcome. The genius will either show up or it won't. But your job is to show up.",
    context_translation: "あなたの仕事は、結果に関わらず現れて仕事をすることです。天才的な力はやって来るかもしれないし、来ないかもしれない。でもあなたの仕事は姿を現すことです。",
    meaning_ja: "（場所に）現れる、姿を見せる、仕事に取り組む",
    nuance: "単に「come（来る）」より「責任を持って出頭する・仕事をやりとげる」ニュアンスが強い。また「予想外の場所で現れる・浮き上がる」という意味でも使われる。",
    example: "The most important thing is to show up every day, even when you don't feel like it.",
    example_translation: "最も大切なことは、気乗りしない日でも毎日姿を現して取り組むことです。",
    cefr_level: "B1",
    why_hard_for_japanese: "「show（見せる）+ up（上へ）」という組み合わせから、「現れる・出頭する」「真剣に取り組む」という意味が読み取りにくい。ビジネス・創造的な文脈での重要表現。",
  },
  {
    expression: "get out of the way",
    type: "idiom",
    context: "Your job is not to judge the work. Your job is not to rate it. Your job is to show up and get out of the way — to let the creativity move through you.",
    context_translation: "あなたの仕事は作品を評価することではありません。評価することでもありません。あなたの仕事は現れて邪魔をしないことです――創造性があなたを通して流れるのを許すことです。",
    meaning_ja: "邪魔をしない、妨げをなくす、道を開ける",
    nuance: "物理的に道を空けるだけでなく、「自我・判断・恐れを脇に置いて創造の流れを妨げない」という比喩的な意味。「don't overthink it」に近い感覚。",
    example: "Sometimes the best thing a manager can do is get out of the way and let the team work.",
    example_translation: "時に管理者にできる最善のことは、邪魔をせずチームに仕事をさせることです。",
    cefr_level: "B2",
    why_hard_for_japanese: "「get out（出る）+ of the way（道から）」という物理的表現から、「自分の判断・恐れを手放して流れに乗る」という比喩的意味への転換が難しい。",
  },
  {
    expression: "be haunted by",
    type: "collocation",
    context: "I was haunted by the idea that I would never be able to write anything as good as my first book. That fear was paralyzing.",
    context_translation: "最初の本と同じくらい良いものを二度と書けないかもしれないという考えに取り憑かれていました。その恐れは麻痺させるものでした。",
    meaning_ja: "〜に取り憑かれている、〜が頭から離れない",
    nuance: "考え・記憶・感情が霊のようにずっとつきまとう状態。「obsessed with」より「本人の意志に反してついてくる」受動的で暗い印象がある。",
    example: "He was haunted by the memory of what he had said that day.",
    example_translation: "彼はその日言ったことの記憶に取り憑かれていました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「haunt（幽霊が出没する）」という語義は知っていても、「記憶・感情が頭から離れない」という比喩的用法を感情表現として使えるようになるには意識的な習得が必要。",
  },
  {
    expression: "pour into",
    type: "phrasal_verb",
    context: "You have to pour yourself into your work without knowing whether it will be good or not. That's the only way to create.",
    context_translation: "良いかどうかを知らないまま、自分を作品に注ぎ込まなければなりません。それだけが創造する唯一の方法です。",
    meaning_ja: "〜に全力を注ぐ、〜に感情・エネルギーを注ぎ込む",
    nuance: "液体を容器に注ぐイメージから、「時間・情熱・エネルギーを惜しまず投入する」という比喩。「invest in」より感情的・身体的な没入感が強い。",
    example: "She poured everything she had into making the project a success.",
    example_translation: "彼女はプロジェクトを成功させるために持てるすべてを注ぎ込みました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「pour（注ぐ）」という物理的動作から「エネルギー・感情を投入する」という比喩的意味への転換が難しく、「put effort into」などで言い換えてしまいがち。",
  },
  {
    expression: "have a go at",
    type: "idiom",
    context: "The ancient Greeks didn't believe that creativity came from within. They believed a genius — a magical being — would come and have a go at inspiring you.",
    context_translation: "古代ギリシャ人は創造性が内部から来るとは思っていませんでした。彼らは天才――魔法の存在――がやって来て、あなたに霊感を与えようとすると信じていました。",
    meaning_ja: "〜を試みる、〜に挑戦する",
    nuance: "「try」のカジュアルで積極的な表現。主にイギリス・オーストラリア英語で使われる。軽い挑戦や試み、「やってみようか」という気軽な態度を表す。",
    example: "I've never played chess before, but I'd love to have a go at it.",
    example_translation: "チェスをやったことはないけど、ぜひ一度試してみたいです。",
    cefr_level: "B1",
    why_hard_for_japanese: "「have a try」という表現と混同されやすく、また「give it a go」という別の言い方もあるため、使い分けに迷う学習者が多い。主にイギリス英語であることも注意点。",
    transcriptHighlight: "had a go at",
  },
  {
    expression: "come through",
    type: "phrasal_verb",
    context: "Creativity doesn't come from a place of perfection. It comes through you. You are a vessel. Your job is to be ready when it comes through.",
    context_translation: "創造性は完璧な場所からは来ません。それはあなたを通して来ます。あなたは器です。あなたの仕事は、それが通り抜けてくるときに準備ができていることです。",
    meaning_ja: "（困難を）乗り越える、（物が人を）通り抜ける、届く",
    nuance: "2つの主な意味がある。①困難・危機を乗り越える（例：come through a difficult time）、②信号・感情・エネルギーが伝わる・届く。Gilbertの文脈では②の「通り抜ける」用法。",
    example: "Great art comes through the artist, not from them.",
    example_translation: "偉大な芸術はアーティストを通して来るものであり、アーティストから来るものではありません。",
    cefr_level: "B2",
    why_hard_for_japanese: "come through の「乗り越える」という意味は知っていても、「〜を通り抜けて届く・伝わる」という意味での使い方が日本語には対応する表現がなく習得しにくい。",
  },
];

const GILBERT_TRANSCRIPT = `I am a writer. Writing books is my profession, but it's more than that. It is my great lifelong love and fascination. And I don't expect that to ever change.

But when I was in the middle of writing my last book, I found myself in a state of fear. Not just nerves, but a deep, paralyzing kind of fear. What if this book is terrible? What if I'm a fraud? I was haunted by the idea that I might fail.

Then I started thinking about other creative people throughout history, and how they managed this kind of anxiety.

The ancient Greeks and Romans didn't believe that creativity came from human beings. They believed that creativity was this divine attendant spirit — they called it a daemon or genius — that came and had a go at inspiring you.

So if your work was brilliant, it wasn't entirely yours. The genius did it. If your work was terrible, it wasn't entirely your fault either.

What I'm suggesting is this: your job is to show up and do your work. Pour into the work everything you have. Get out of the way of your own creativity. Don't judge it. Don't hold yourself responsible for whether it comes through or not.

Because creativity comes through you, not from you. You are a vessel. Show up, do the work, and let the mysterious force come through.`;

// ─────────────────────────────────────────────────────────────────────────────

const ADICHIE_PHRASES: PhraseResult[] = [
  {
    expression: "reduce to",
    type: "phrasal_verb",
    context: "The single story creates stereotypes, and the problem with stereotypes is not that they are untrue, but that they are incomplete. They reduce a whole person to one thing.",
    context_translation: "ひとつの物語はステレオタイプを生み、ステレオタイプの問題は偽りであることではなく、不完全であることです。それは人全体をひとつのことに縮小してしまいます。",
    meaning_ja: "〜を〜に縮小する、〜だけに矮小化する",
    nuance: "複雑・多面的なものを単純な一側面だけに圧縮してしまう行為。「simplify」より「本来の豊かさを失わせる・不当に小さくする」否定的なニュアンスが強い。",
    example: "We should not reduce a person's identity to their nationality alone.",
    example_translation: "人のアイデンティティを国籍だけに矮小化すべきではありません。",
    cefr_level: "B2",
    why_hard_for_japanese: "「reduce（減らす）」は知っていても、「人・物事を一側面だけに縮小する」という比喩的な「reduce A to B」の構文を使いこなすのが難しい。",
  },
  {
    expression: "be stripped of",
    type: "collocation",
    context: "When you show a people as one thing, only one thing, over and over again, that is what they become. They are stripped of their complexity and their humanity.",
    context_translation: "ある人々をひとつのことだけとして、繰り返し示し続けると、彼らはそれになってしまいます。彼らは複雑さと人間性を剥ぎ取られます。",
    meaning_ja: "〜を剥奪される、〜を取り上げられる",
    nuance: "権利・尊厳・特質などを力によって奪われること。「be deprived of」より暴力的・強制的なニュアンスがある。人権・アイデンティティの文脈で強く使われる表現。",
    example: "Prisoners should not be stripped of their basic human rights.",
    example_translation: "囚人であっても、基本的人権を剥奪されるべきではありません。",
    cefr_level: "C1",
    why_hard_for_japanese: "「strip（剥ぐ）」という動詞自体が日本語話者には頻度が低く、受動態「be stripped of 〜」で「〜を奪われる」という表現として習得するのが難しい。",
  },
  {
    expression: "account for",
    type: "phrasal_verb",
    context: "I had a professor who told me my novel was not authentically African. She said I had not accounted for the fact that Africa is a continent, not a country.",
    context_translation: "私の小説は真にアフリカ的ではないと言った教授がいました。アフリカは国ではなく大陸であるという事実を考慮していなかった、と言われました。",
    meaning_ja: "〜を考慮する、〜を説明する、〜の割合を占める",
    nuance: "3つの主要な意味がある多義語：①（割合を）占める、②（理由を）説明する、③（要素を）考慮に入れる。文脈によって使い分けが必要な重要句動詞。",
    example: "Did your plan account for the possibility of bad weather?",
    example_translation: "あなたの計画は悪天候の可能性を考慮していましたか？",
    cefr_level: "B2",
    why_hard_for_japanese: "3つの意味が文脈によって変わるため混乱しやすい。「考慮する」という意味の account for は特に日本語に対応する簡単な表現がなく、使いこなすのが難しい。",
  },
  {
    expression: "dismiss as",
    type: "collocation",
    context: "Stories have been used to dispossess and to malign. But stories can also be used to empower and to humanize. When you dismiss a culture as primitive, you have told only one story.",
    context_translation: "物語は奪い、中傷するために使われてきました。しかし物語は力を与え、人間化するためにも使えます。文化を原始的と切り捨てるとき、あなたはひとつの物語しか語っていません。",
    meaning_ja: "〜として切り捨てる、〜として無視する",
    nuance: "主張・人・考えを検討に値しないとして否定・無視すること。「ignore」より能動的な「退ける・取り合わない」姿勢を示す。知的な議論での反論文脈で頻用される。",
    example: "Don't dismiss someone's experience just because it's different from your own.",
    example_translation: "自分と違うからといって、他者の経験を切り捨ててはいけません。",
    cefr_level: "B2",
    why_hard_for_japanese: "「dismiss（解雇する・却下する）」という単語は知っていても、「dismiss as 〜（〜として切り捨てる）」という構文での使い方が定着しにくい。",
  },
  {
    expression: "give voice to",
    type: "idiom",
    context: "Literature gives voice to the voiceless. When we read only stories of triumph over adversity, we give voice to the idea that poverty is shameful.",
    context_translation: "文学は声なき者に声を与えます。逆境への勝利の物語だけを読むとき、私たちは貧困が恥ずかしいものだという考えに声を与えています。",
    meaning_ja: "〜に声を与える、〜を表現・代弁する",
    nuance: "声を持たない存在・感情・考えを表現すること。「express（表現する）」より「代わりに語る・代弁する」という他者への奉仕的なニュアンスが強い。文学・政治・芸術の文脈で重要。",
    example: "This documentary gives voice to communities that are rarely heard.",
    example_translation: "このドキュメンタリーは、ほとんど聞かれることのないコミュニティに声を与えています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「give（与える）+ voice（声）+ to（〜に）」という構造はシンプルだが、「代弁する・表現する」という抽象的な意味のコロケーションとして自然に使えるまでには練習が必要。",
  },
  {
    expression: "dispossess",
    type: "collocation",
    context: "How they are told, who tells them, when they are told, how many stories are told, are really dependent on power. Stories have been used to dispossess and to malign, but stories can also empower.",
    context_translation: "どのように語られるか、誰が語るか、いつ語られるか、いくつの物語が語られるかは、本当に権力に依存しています。物語は剥奪と中傷に使われてきましたが、力を与えるためにも使えます。",
    meaning_ja: "〜から財産・土地・権利を奪う",
    nuance: "（主に権力によって）人々から財産・土地・権利・居場所を奪い去ること。植民地主義・歴史的不正義の文脈で使われる重い単語。「deprive」より強制的・組織的なニュアンスがある。",
    example: "Colonial powers used stories to dispossess indigenous peoples of their land and culture.",
    example_translation: "植民地支配者たちは物語を使って、先住民から土地と文化を奪いました。",
    cefr_level: "C1",
    why_hard_for_japanese: "非常に高度な語彙で、日常的に使うことはほとんどないが、歴史・社会問題について英語で議論するために必要な重要語。「possess（所有する）」の反意語として理解できる。",
  },
];

const ADICHIE_TRANSCRIPT = `I'm a storyteller. And I would like to tell you a few personal stories about what I like to call "the danger of the single story."

I grew up in Nigeria. When I began writing at age seven, I wrote stories about white children who played in the snow and ate apples. This is because all the books I had read were foreign.

Later, a university professor told me my novel was not "authentically African." I had not written about poverty, starvation, or war. He hadn't accounted for the fact that I had a middle-class upbringing.

So that is how to create a single story: show a people as one thing, over and over again. That is what they become.

I recently spoke at a university. A well-meaning American student said to me, "It's such a shame that Nigerian men are physical abusers like the man in your novel." I had not accounted for the impact of my writing.

Stories matter. Many stories matter. Stories have been used to dispossess and to malign, but stories can also be used to empower and to humanize. Stories can break the dignity of a people — but stories can also repair that broken dignity.

When we reject the single story, when we realize that there is never a single story about any place or person, we regain a kind of paradise. Give voice to the multiple stories. Because the single story creates stereotypes. Stereotypes reduce a whole person to one thing. They are stripped of their complexity and humanity. When you dismiss a culture as primitive, you have told only one story. And that is always dangerous.`;

// ─────────────────────────────────────────────────────────────────────────────

const ROWLING_PHRASES: PhraseResult[] = [
  {
    expression: "rock bottom",
    type: "idiom",
    context: "I had failed on an epic scale. An exceptionally short-lived marriage had imploded. I was jobless, a lone parent, and as poor as it is possible to be in modern Britain without being homeless. I had hit rock bottom.",
    context_translation: "私は壮大なスケールで失敗しました。非常に短命な結婚は崩壊しました。無職で、シングルペアレントで、ホームレスにならない範囲で現代のイギリスで可能な限り貧しかった。どん底に落ちていました。",
    meaning_ja: "どん底（に達する）、最低の状態",
    nuance: "経済的・精神的・社会的に最も低い状態に達すること。「hit rock bottom」で「どん底を経験する」という定型表現として使われる。そこから上昇するというポジティブな転機の文脈でよく使われる。",
    example: "He had to hit rock bottom before he finally asked for help.",
    example_translation: "彼はどん底に落ちて初めて助けを求めました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「rock（岩）+ bottom（底）」から「最低点・どん底」という意味が直感的でない。また「hit rock bottom（どん底に落ちる）」という動詞との組み合わせも覚える必要がある。",
  },
  {
    expression: "come to terms with",
    type: "idiom",
    context: "I stopped pretending to myself that I was anything other than what I was, and began to direct all my energy to finishing the only work that mattered. I came to terms with failure.",
    context_translation: "自分が何者でもないかのように自分に嘘をつくのをやめ、唯一重要な仕事を完成させることにすべてのエネルギーを向け始めました。失敗を受け入れました。",
    meaning_ja: "〜を受け入れる、〜と折り合いをつける",
    nuance: "難しい現実・感情・状況を「戦わずに受け入れる」こと。「accept」より「葛藤の末に折り合いをつける」プロセスが含まれる。悲しみ・失敗・病気など困難な事実と向き合う文脈で使われる。",
    example: "It took years for her to come to terms with losing the championship.",
    example_translation: "優勝を逃したことと折り合いをつけるのに何年もかかりました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「terms（条件）」という単語から「受け入れる」という意味への連想が難しく、このイディオムとして丸ごと覚える必要がある。",
  },
  {
    expression: "set out",
    type: "phrasal_verb",
    context: "Half my lifetime ago, I set out on a journey. I did not know where it would lead me. But I had a story to tell, and I believed in it.",
    context_translation: "私の人生の半分前、私は旅に出発しました。どこに向かうかは分かりませんでした。しかし語るべき物語があり、私はそれを信じていました。",
    meaning_ja: "〜に着手する、旅立つ、出発する",
    nuance: "目的・目標を持って何かを始めること・旅立つこと。「start」より「意図・目的を持った出発」のニュアンスが強い。「set out to do 〜（〜しようとする）」の形も重要。",
    example: "When she set out to write the novel, she had no idea it would become a bestseller.",
    example_translation: "小説を書き始めたとき、彼女はそれがベストセラーになるとは思っていませんでした。",
    cefr_level: "B1",
    why_hard_for_japanese: "「set（置く）+ out（外へ）」から「出発する・着手する」という意味が直感的でなく、「start」と使い分けるニュアンスも日本語話者には理解が難しい。",
  },
  {
    expression: "strip away",
    type: "phrasal_verb",
    context: "Failure stripped away the inessential. I stopped pretending to myself that I was anything other than what I was. Failure taught me things about myself that I could not have learned any other way.",
    context_translation: "失敗は本質でないものを剥ぎ取りました。自分が何者でもないかのように自分に嘘をつくのをやめました。失敗は他の方法では学べなかったことを自分自身について教えてくれました。",
    meaning_ja: "〜を剥ぎ取る、〜を取り除く",
    nuance: "不必要なもの・表面的なものを除去して本質を露わにすること。「remove」より「力強く・完全に取り除く」印象がある。比喩的に「幻想・虚飾を取り除く」文脈で特に使われる。",
    example: "Illness can strip away everything that isn't truly important.",
    example_translation: "病気は本当に大切でないものすべてを剥ぎ取ることがあります。",
    cefr_level: "B2",
    why_hard_for_japanese: "「strip（剥ぐ）+ away（離れて）」から「不要なものを完全に取り除く」という比喩的意味への転換が難しく、使いこなすには意識的な練習が必要。",
    transcriptHighlight: "stripped away",
  },
  {
    expression: "draw on",
    type: "phrasal_verb",
    context: "I began to draw on my imagination rather than on the experiences I was ashamed of. Writers need to draw on their own lives. The most important thing in life is to draw on what you have.",
    context_translation: "恥じている経験ではなく、想像力を活用し始めました。作家は自分の人生を活用する必要があります。人生で最も重要なことは、自分が持っているものを活用することです。",
    meaning_ja: "〜を活用する、〜を引き出す",
    nuance: "知識・経験・資源・才能を「引き出して使う」こと。「use」より「蓄積したものを意識的に取り出して活用する」ニュアンスがある。特に創造的・知的な活動の文脈で使われる。",
    example: "Good teachers draw on their students' existing knowledge rather than starting from scratch.",
    example_translation: "良い教師は最初から始めるのではなく、生徒の既存の知識を活用します。",
    cefr_level: "B2",
    why_hard_for_japanese: "「draw（引く）+ on（〜に）」から「活用する・利用する」という意味が直感的でなく、「use / utilize」で言い換えてしまいがちな表現。",
  },
  {
    expression: "be rooted in",
    type: "collocation",
    context: "Imagination is the power that enables us to empathize with humans whose experiences we have never shared. It is rooted in our common humanity.",
    context_translation: "想像力は、自分が共有したことのない経験を持つ人間に共感できるようにする力です。それは私たちの共通の人間性に根ざしています。",
    meaning_ja: "〜に根ざしている、〜に基づいている",
    nuance: "考え・信念・行動が深い部分で特定の価値観・文化・経験に基づいていること。「based on」より「深く根付いている・切り離せない」強い結びつきを表す。",
    example: "Her compassion is deeply rooted in her own experience of suffering.",
    example_translation: "彼女の思いやりは、自身の苦しみの経験に深く根ざしています。",
    cefr_level: "B2",
    why_hard_for_japanese: "「root（根）」という植物的なメタファーから「根ざす・基づく」という抽象的な意味への転換が難しく、「based on」に言い換えてしまいがち。",
    transcriptHighlight: "rooted in",
  },
];

const ROWLING_TRANSCRIPT = `The first thing I would like to say is "thank you." Not only has Harvard given me an extraordinary honor, but the weeks of fear and nausea I've experienced at the thought of giving this commencement address have made me lose weight.

I have decided to talk to you about the benefits of failure. And as you stand on the threshold of what is sometimes called "real life," I want to extol the crucial importance of imagination.

I was jobless, a lone parent, and as poor as it is possible to be in modern Britain, without being homeless. By every usual standard, I had failed.

I had hit rock bottom. And rock bottom became the solid foundation on which I rebuilt my life.

You might never fail on the scale I did, but some failure in life is inevitable. It is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all — in which case, you fail by default.

Half my lifetime ago, I set out with one goal: to finish the book that was burning inside me. Failure stripped away the inessential. I stopped pretending to myself that I was anything other than what I was. I came to terms with failure and began to draw on my imagination, on the one quality I valued above all others.

Imagination is not only the uniquely human capacity to envision that which is not, but it is the power that enables us to empathize with humans whose experiences we have never shared. Its foundation is rooted in our common humanity.

We do not need magic to change the world. We carry all the power we need inside ourselves already.`;

// ─────────────────────────────────────────────────────────────────────────────

const MICHELLE_OBAMA_PHRASES: PhraseResult[] = [
  {
    expression: "reach for",
    type: "phrasal_verb",
    context: "Don't be afraid. Be focused. Be determined. Be hopeful. Be empowered. Empower yourselves with a good education, then get out there and use that education to build a country worthy of your boundless promise. Reach for it.",
    context_translation: "恐れないでください。集中してください。決意を持ってください。希望を持ってください。力を与えてもらってください。良い教育で自分を力強くし、その教育を使って無限の可能性にふさわしい国を作ってください。そこへ手を伸ばしてください。",
    meaning_ja: "〜に手を伸ばす、〜を目指す",
    nuance: "手を物理的に伸ばすだけでなく、「夢・目標・可能性に向かって積極的に努力する」比喩的な意味が強い。「aim for」より能動的・身体的なエネルギーを感じさせる表現。",
    example: "You have to reach for opportunities rather than waiting for them to come to you.",
    example_translation: "機会がやってくるのを待つのではなく、自ら手を伸ばして掴みに行かなければなりません。",
    cefr_level: "B1",
    why_hard_for_japanese: "「reach（届く）+ for（〜を求めて）」の組み合わせは、「手を伸ばして取ろうとする」物理的イメージから「目標を目指す」という比喩的意味への転換が必要。",
  },
  {
    expression: "count on",
    type: "phrasal_verb",
    context: "In this election, and in every election, it is about whether we can count on this person to lead us. Barack has proven himself. I can count on him every day.",
    context_translation: "この選挙でも、すべての選挙でも、この人物を頼りにできるかどうかが問題です。バラクは自分を証明しました。私は毎日彼を頼りにできます。",
    meaning_ja: "〜を頼りにする、〜を当てにする",
    nuance: "「rely on / depend on」とほぼ同義だが、よりカジュアルで会話的。特に「この人は裏切らない」という信頼・確信のニュアンスが強い。",
    example: "When things get hard, I know I can count on my friends.",
    example_translation: "辛いときは、友達を頼りにできると分かっています。",
    cefr_level: "A2",
    why_hard_for_japanese: "「count（数える）+ on（〜に）」から「頼りにする」という意味が連想しにくい。「rely on / depend on」との使い分けも含め、会話で自然に使えるまで練習が必要。",
  },
  {
    expression: "be surrounded by",
    type: "collocation",
    context: "I wake up every morning in a house that was built by slaves. And I watch my daughters — two beautiful, intelligent, Black young women — playing with their dogs on the White House lawn. And because of Hillary Clinton, my daughters — and all our sons and daughters — now take for granted that a woman can be on the presidential ticket. Be surrounded by people who push you to be better.",
    context_translation: "私は毎朝、奴隷によって建てられた家で目覚めます。そして二人の美しく賢い黒人の若い女性である娘たちが、ホワイトハウスの芝生で犬と遊ぶのを見ます。自分を高めてくれる人々に囲まれてください。",
    meaning_ja: "〜に囲まれている",
    nuance: "物理的に囲まれているだけでなく、特定の環境・人・価値観に常に接している状態。「環境が人を形成する」文脈でよく使われる。",
    example: "If you want to grow, surround yourself with people who challenge you.",
    example_translation: "成長したいなら、あなたに挑戦をもたらす人々に囲まれてください。",
    cefr_level: "B1",
    why_hard_for_japanese: "受動態での「be surrounded by」という形が日本語話者には作りにくく、「まわりに〜がいる」という能動的な発想に変換して使う練習が必要。",
  },
  {
    expression: "pour into",
    type: "phrasal_verb",
    context: "Barack and I have poured everything we have into this campaign because we believe in what we are fighting for. Every day I pour everything I have into being a mother and a First Lady.",
    context_translation: "バラクと私は信じているもののために戦っているので、このキャンペーンにすべてを注ぎ込んできました。毎日、母として、ファーストレディとしての責任にすべてを注ぎ込んでいます。",
    meaning_ja: "〜に全力を注ぐ、〜に注ぎ込む",
    nuance: "時間・エネルギー・感情・情熱を惜しみなく投入すること。「invest in」より「身を削る・全力を傾ける」強度のある比喩。",
    example: "She poured everything into raising her children after losing her job.",
    example_translation: "仕事を失った後、彼女は子育てにすべてを注ぎ込みました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「pour（注ぐ）」という物理的動作から「全力を注ぐ」という比喩的意味への転換が難しく、「put effort into」などに言い換えてしまいがち。",
  },
  {
    expression: "be worthy of",
    type: "collocation",
    context: "I want a president who will teach our children that everyone in this country matters. A president who truly believes in the vision that our Founders put forth: that we are all created equal, each a little worthy of the same shot at that American dream.",
    context_translation: "この国のすべての人が大切だと子どもたちに教える大統領が欲しい。すべての人は平等に生まれ、アメリカンドリームへの同じチャンスにそれぞれが値すると、建国者が示したビジョンを本当に信じる大統領を。",
    meaning_ja: "〜に値する、〜にふさわしい",
    nuance: "尊厳・権利・機会を受けるにふさわしいという内面的な価値を表す。「deserve」と似ているが、be worthy of は「存在そのものの価値・尊厳」に焦点を当てる。",
    example: "Every child is worthy of a safe and loving home.",
    example_translation: "すべての子どもは安全で愛情ある家庭に値します。",
    cefr_level: "B2",
    why_hard_for_japanese: "「worthy（価値のある）」が日常語彙に入っていない学習者が多く、「deserve」との使い分けも含め、積極的に使えるよう意識的な練習が必要。",
    transcriptHighlight: "worthy of",
  },
  {
    expression: "take for granted",
    type: "idiom",
    context: "Because of Hillary Clinton, my daughters take for granted that a woman can be on the presidential ticket. We cannot take for granted the rights that others have fought to secure.",
    context_translation: "ヒラリー・クリントンのおかげで、私の娘たちは女性が大統領候補になれることを当然のことと思っています。他の人々が勝ち取るために戦ってきた権利を当然視することはできません。",
    meaning_ja: "〜を当然のことと思う",
    nuance: "価値あるものをありがたみを感じずに当然視すること。権利・関係・機会など「あって当然」と思いがちなものへの感謝を促す文脈で使われる。",
    example: "Don't take your health for granted — take care of yourself.",
    example_translation: "健康を当然のことと思わないでください――自分を大切にしてください。",
    cefr_level: "B2",
    why_hard_for_japanese: "「take（取る）+ for granted（当然として）」という構造が直訳では意味をなさず、「当然視する」というイディオムとして丸ごと習得する必要がある。",
  },
];

const MICHELLE_OBAMA_TRANSCRIPT = `You know, it's hard to believe that it has been eight years since I first came to the White House as First Lady. Eight years ago, I was a 44-year-old woman — a mother, a wife, a daughter — and I was terrified.

I wake up every morning in a house that was built by slaves. And I watch my daughters — two beautiful, intelligent, Black young women — playing with their dogs on the White House lawn.

Because of Hillary Clinton, my daughters — and all our sons and daughters — now take for granted that a woman can be on the presidential ticket.

I want a leader who is worthy of that hope. Someone who will teach our children that everyone in this country matters — a president who truly believes that when you've worked hard, done right by your children, played by the rules, you deserve to be counted.

Do not let anyone ever tell you that this country isn't great. Because this right now is the greatest country on earth.

Barack and I pour into this campaign everything we have. Every day I watch him face impossible decisions with grace and humility. I can count on him.

When they go low, we go high. Be surrounded by people who push you to be better. Reach for the promise that this country has always held out to those who are brave enough to reach for it.`;

// ─────────────────────────────────────────────────────────────────────────────

const PAUSCH_PHRASES: PhraseResult[] = [
  {
    expression: "brick wall",
    type: "idiom",
    context: "The brick walls are there for a reason. The brick walls are not there to keep us out. The brick walls are there to give us a chance to show how badly we want something.",
    context_translation: "レンガの壁は理由があってそこにあります。レンガの壁は私たちを阻むためにあるのではありません。どれだけ何かを望んでいるかを示すチャンスを与えるためにあります。",
    meaning_ja: "（比喩）越えられない壁、障壁",
    nuance: "夢・目標の前に立ちはだかる困難・障害の比喩。Pauschのこのフレーズは「壁は諦めさせるためではなく、本気度を試すためにある」という逆説的な意味で有名になった。",
    example: "Every time I hit a brick wall, I asked myself how badly I really wanted it.",
    example_translation: "越えられない壁にぶつかるたびに、本当にどれだけそれを望んでいるかを自問しました。",
    cefr_level: "B1",
    why_hard_for_japanese: "「brick wall（レンガの壁）」という具体的な表現が「障壁・困難」を指す比喩として使われることを知らないと、文字通りの壁として理解してしまう。",
  },
  {
    expression: "look back on",
    type: "phrasal_verb",
    context: "When I look back on all those years, I can see how every obstacle made me stronger. When you look back on your life, the biggest regrets won't be the things you did — they'll be the things you didn't do.",
    context_translation: "あの年月を振り返ると、すべての障害が私をどれだけ強くしたかが分かります。人生を振り返るとき、最大の後悔は自分がしたことではなく、しなかったことです。",
    meaning_ja: "〜を振り返る、回顧する",
    nuance: "過去の経験・時間を振り返ること。後悔・学び・感謝など様々な感情を伴うことが多い。「reflect on」よりカジュアルで日常的。",
    example: "I hope that when you look back on this day, you'll feel proud of what you chose.",
    example_translation: "この日を振り返るとき、自分の選択を誇りに思えることを願っています。",
    cefr_level: "A2",
    why_hard_for_japanese: "「look（見る）+ back（後ろへ）」という方向の組み合わせから「過去を振り返る」という意味は分かりやすいが、自然に使いこなすには定型表現として覚える必要がある。",
  },
  {
    expression: "get out of",
    type: "phrasal_verb",
    context: "Experience is what you get when you didn't get what you wanted. And experience is often the most valuable thing you have to offer. What do you get out of every situation, even the bad ones?",
    context_translation: "経験とは、望んでいたものを得られなかったときに得るものです。そして経験はしばしば、あなたが提供できる最も価値あるものです。悪い状況からも、何を得られますか？",
    meaning_ja: "〜から得る、〜から抜け出す",
    nuance: "2つの主な意味：①「〜から何かを得る・取り出す」②「〜から抜け出す・逃れる」。Pauschの文脈では①の「状況から学び・価値を引き出す」という用法。",
    example: "What do you get out of reading books every day? Better thinking and bigger vocabulary.",
    example_translation: "毎日読書から何を得ますか？より深い思考と豊かな語彙です。",
    cefr_level: "B1",
    why_hard_for_japanese: "「get（得る）+ out of（〜から）」という形が文脈によって「得る」と「抜け出す」の2つの意味を持つため、使い分けに混乱しやすい。",
  },
  {
    expression: "live up to",
    type: "phrasal_verb",
    context: "My parents lived up to their promises. They told me I could do anything, and they meant it. I want to live up to the expectations of the people who believed in me.",
    context_translation: "両親は約束を果たしてくれました。何でもできると言ってくれて、本気でそう言っていました。私を信じてくれた人々の期待に応えたい。",
    meaning_ja: "〜の期待・基準に応える、〜にふさわしくある",
    nuance: "期待・評判・約束・基準などを満たすか上回ること。否定形「can't live up to」でプレッシャーや失望の文脈でも使われる。",
    example: "The movie failed to live up to the hype — it was quite disappointing.",
    example_translation: "その映画は評判に応えられず、かなり期待外れでした。",
    cefr_level: "B2",
    why_hard_for_japanese: "「live（生きる）+ up to（〜に向かって）」から「期待に応える」という意味が連想しにくく、このイディオムとして丸ごと覚える必要がある。",
  },
  {
    expression: "work one's way through",
    type: "grammar_pattern",
    context: "I worked my way through college. My parents didn't have the money for tuition. But I found a way, and it made me stronger.",
    context_translation: "私は働きながら大学を卒業しました。両親には学費がありませんでした。しかし方法を見つけ、それが私を強くしました。",
    meaning_ja: "（苦労して）〜を乗り越える、働きながら〜を終える",
    nuance: "「work one's way through college」で「働きながら大学を卒業する」という定型表現。「through」の前後に困難・プロセスを置いて「苦労して進む・乗り越える」意味で使える応用性の高い構文。",
    example: "She worked her way through medical school by taking on multiple part-time jobs.",
    example_translation: "彼女はいくつものアルバイトをしながら医学部を卒業しました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「work one's way through」という構文全体で「苦労して乗り越える」を表すことを知らないと、各単語の意味を足し算しても意味が取れない。",
    transcriptHighlight: "worked my way through",
  },
  {
    expression: "make the most of",
    type: "idiom",
    context: "I have months to live. But I intend to make the most of every day. Decide right now to make the most of the time you have. That is the only thing any of us can do.",
    context_translation: "私には数ヶ月しかありません。しかし毎日を最大限に活かすつもりです。今すぐ、自分に残された時間を最大限に活かすことを決意してください。それが私たち全員にできる唯一のことです。",
    meaning_ja: "〜を最大限に活用する",
    nuance: "限られた時間・機会・資源を無駄にせず最大限に使うこと。「use effectively」より「もったいなくしない・余すところなく活かす」という強い意志を含む。",
    example: "Make the most of your twenties — it's a time you'll never get back.",
    example_translation: "20代を最大限に活かしてください――二度と戻ってこない時間です。",
    cefr_level: "B1",
    why_hard_for_japanese: "「make the most of」というイディオム全体の意味を知らないと、「most（最も）」からの連想だけでは意味が取れない。「maximize」と同義だが会話・スピーチではこちらが自然。",
  },
];

const PAUSCH_TRANSCRIPT = `Thank you all very much. I have an interesting challenge. I have cancer and I have months to live. So this is the talk of my life.

But I'm in great shape. I'm in really good shape. And I intend to make the most of that.

So I want to talk about childhood dreams. You know, all those things from our past — the brick walls.

The brick walls are there for a reason. They're not there to keep us out. The brick walls are there to give us a chance to show how badly we want something.

Experience is what you get when you didn't get what you wanted. What do you get out of every setback, every obstacle? Experience. And experience is often the most valuable thing you have to offer.

I worked my way through college, learned things along the way that nobody had planned to teach me. But I also learned to live up to the expectations of people who believed in me.

When I look back on all the obstacles, I can see how each one taught me something essential. And I want to use the time I have left to pass those lessons on.

So the key question to ask is: Are you a Tigger or an Eeyore? Do you find the brick walls to stop you, or the brick walls to show how much you want it?

Make the most of every day. And help others do the same.`;

// ─────────────────────────────────────────────────────────────────────────────

const OBAMA_FAREWELL_PHRASES: PhraseResult[] = [
  {
    expression: "grapple with",
    type: "collocation",
    context: "We must grapple with a fundamental paradox as a nation: we are a government of, by, and for the people — yet as a people we can be divided.",
    context_translation: "私たちは国家として根本的な逆説と格闘しなければなりません：私たちは国民の、国民による、国民のための政府です――しかし国民として私たちは分断されることもある。",
    meaning_ja: "〜と格闘する、〜に真剣に取り組む",
    nuance: "困難・複雑な問題と真剣に取り組むこと。「struggle with」より知的・分析的な格闘を意味し、ニュース・政策・倫理の議論など知的な文脈で好まれる。",
    example: "Scientists continue to grapple with the complexity of the human brain.",
    example_translation: "科学者たちは人間の脳の複雑さと格闘し続けています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「grapple（取っ組む）」という単語自体が日本語話者には低頻度で、「deal with / struggle with」との使い分けを含め、フォーマルな文脈での知的格闘を表す語として習得する必要がある。",
  },
  {
    expression: "hold fast to",
    type: "idiom",
    context: "Democracy depends on something more fundamental than elections. It requires holding fast to the values of tolerance and pluralism. We must hold fast to the idea that all people are created equal.",
    context_translation: "民主主義は選挙より根本的なものに依存しています。寛容と多元主義の価値観をしっかり守ることが必要です。すべての人は平等に創られたという考えをしっかり守らなければなりません。",
    meaning_ja: "〜をしっかり守る、〜に固執する",
    nuance: "信念・価値観・原則を諦めずに守り続けること。「maintain」より意志の強さと困難への抵抗を含む。「fast」は「しっかりと・固く」という古語的な副詞。",
    example: "In difficult times, we must hold fast to our principles.",
    example_translation: "困難な時代にこそ、私たちは原則をしっかり守らなければなりません。",
    cefr_level: "C1",
    why_hard_for_japanese: "「fast（速い）」という通常の意味と異なり、「hold fast（しっかりと保つ）」での fast は「固く・しっかりと」という古語的副詞で、この用法は日本語話者には非常に不透明。",
  },
  {
    expression: "bear witness to",
    type: "collocation",
    context: "I have been the recipient of undeserved grace — both by articulating values that have made us the last, best hope of Earth, and by bearing witness to the endurance of the democratic ideal.",
    context_translation: "私は分不相応な恩寵を受けてきました――地球上の最後の、最良の希望となる価値を言葉にすることと、民主主義の理想の持続力に証人となることの両方によって。",
    meaning_ja: "〜の証人となる、〜を目撃・証言する",
    nuance: "歴史的・重要な出来事の目撃者・証人となること。単なる「see（見る）」より「その事実を証言する責任を負う」という重みがある。宗教的・法的な語源を持つ格調高い表現。",
    example: "This generation has borne witness to extraordinary change.",
    example_translation: "この世代は非常な変化の証人となってきました。",
    cefr_level: "C1",
    why_hard_for_japanese: "「bear（運ぶ・耐える）+ witness（証人）」という組み合わせから「証人となる」という意味が直感的でなく、フォーマルな文脈での高度な表現として習得する必要がある。",
  },
  {
    expression: "be bound up with",
    type: "collocation",
    context: "Our individual freedom is inextricably bound up with the freedom of every soul on Earth. The progress of human civilization has always been bound up with the expansion of rights.",
    context_translation: "私たちの個人の自由は、地球上のすべての魂の自由と不可分に結びついています。人類文明の進歩は常に権利の拡大と結びついてきました。",
    meaning_ja: "〜と密接に結びついている",
    nuance: "2つの事柄が切り離せないほど深く絡み合っていること。「closely connected with」より「縛られるほど強く結びついている」ニュアンスがある。アカデミックな文章や政治言語でよく使われる。",
    example: "National identity is often bound up with language and shared history.",
    example_translation: "国民的アイデンティティはしばしば言語と共有された歴史と密接に結びついています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「bound（縛られた）+ up with（〜と）」という受動的な形が日本語話者には作りにくく、「関連している」を表す他の表現（related to / connected with）との使い分けにも注意が必要。",
  },
  {
    expression: "call upon",
    type: "phrasal_verb",
    context: "I am asking you to believe. Not in my ability to bring about change — but in yours. I am calling upon the citizenship skills of every American.",
    context_translation: "信じることをお願いします。変化をもたらす私の能力ではなく、あなたの能力を。私はすべてのアメリカ国民の市民としての力を呼びかけています。",
    meaning_ja: "〜に求める、〜に訴えかける、〜を呼び出す",
    nuance: "「ask」より公式・格式高く、特定の責任・行動を求めるニュアンス。政治・宗教・公式な文脈でよく使われる。「I call upon you to 〜」の形が定型的。",
    example: "The president called upon citizens to remain calm during the crisis.",
    example_translation: "大統領は危機の間、市民に冷静でいるよう求めました。",
    cefr_level: "C1",
    why_hard_for_japanese: "「call on（訪問する・指名する）」と「call upon（求める・訴える）」の使い分けが難しく、また政治・スピーチの格式あるトーンを出すために使いこなすのが難しい表現。",
  },
  {
    expression: "lurch from",
    type: "phrasal_verb",
    context: "Without some common baseline of facts, without a willingness to admit new information and concede that your opponent might be making a fair point, we just keep yelling past each other — lurching from one political crisis to the next.",
    context_translation: "共通の事実の基盤なしに、新しい情報を認め、相手が公正な点を指摘しているかもしれないと認める意欲なしに、私たちはただ互いに叫び続けるだけです――一つの政治的危機から次へとよろめいていきます。",
    meaning_ja: "〜からよろめく、突然〜へ移動する",
    nuance: "制御不能なままに一つの問題から次の問題へと不安定に動くこと。「move（移動する）」より「よろめく・ふらつく」という不安定さを強調する。政治・経済の不安定な状況の描写でよく使われる。",
    example: "The company has been lurching from one financial crisis to the next for years.",
    example_translation: "その会社は何年も一つの財政危機から次へとよろめいています。",
    cefr_level: "C2",
    why_hard_for_japanese: "「lurch（よろめく）」という単語自体が日本語話者には低頻度語で、「lurch from A to B」という構文で「不安定に転々とする」を表せることを知らないと使えない。",
  },
];

const OBAMA_FAREWELL_TRANSCRIPT = `My fellow Americans, Michelle and I have been so touched by all the well-wishes we've received over the past few weeks. But tonight it's my turn to say thanks.

Whether we have seen eye-to-eye or rarely agreed at all, my conversations with you, the American people — in living rooms and schools; at farms and on factory floors; at diners and on distant military outposts — those conversations are what have kept me honest, kept me inspired, and kept me going.

For this constitutional democracy demands our participation, not just every four years, but all the time. When the elections are over and the results are in, when the media cycle moves on, the harder work of forging consensus and fighting corruption and forging policy in a way that actually helps people — that requires all of us. Every day.

We must grapple with a fundamental paradox. We are a government of, by, and for the people. Yet as a people we can be divided. Without some common baseline of facts, we lurch from one crisis to the next.

So hold fast to your democratic values. Be bound up with the common good. Bear witness to our shared history, and call upon future generations to build upon it.

Yes, we did. But the answer was never just about what I can do for you. It's about what we can do together.`;

// ─────────────────────────────────────────────────────────────────────────────

const MUSK_PHRASES: PhraseResult[] = [
  {
    expression: "take the plunge",
    type: "idiom",
    context: "Starting a company is very risky. But at some point you just have to take the plunge and commit. The question is not whether it's risky — everything is risky. The question is whether you can handle the downside.",
    context_translation: "会社を始めることは非常にリスクが高い。しかしある時点で思い切って踏み込み、コミットしなければなりません。リスクがあるかどうかではありません――すべてにリスクがある。問題はダウンサイドに対処できるかどうかです。",
    meaning_ja: "思い切って始める、覚悟を決めて踏み込む",
    nuance: "リスクや不確実性があっても「思い切って始める・飛び込む」という決断の瞬間を表す。水に飛び込むイメージから。「just do it」より計画的・意識的な覚悟を含む。",
    example: "After years of planning, she finally took the plunge and quit her job to start her own business.",
    example_translation: "何年も計画した末、彼女はついに思い切って仕事を辞めて自分のビジネスを始めました。",
    cefr_level: "B2",
    why_hard_for_japanese: "「plunge（飛び込む）」という動詞は知っていても、「take the plunge」というイディオムとして「覚悟して踏み出す」という意味で使いこなすのが難しい。",
  },
  {
    expression: "reason from first principles",
    type: "collocation",
    context: "I think it's important to reason from first principles rather than by analogy. The normal way we conduct our lives is we reason by analogy. But when you reason from first principles, you reduce things to the fundamental truths and build up from there.",
    context_translation: "類推ではなく、第一原理から考えることが重要だと思います。普通の生き方は類推によって推論することです。しかし第一原理から考えるとき、物事を根本的な真実に還元し、そこから積み上げます。",
    meaning_ja: "第一原理から考える、根本から推論する",
    nuance: "既存の常識・前例・類推に頼らず、根本的な事実・法則から論理を積み上げて考えること。Muskの思考法として広く知られ、物理学の方法論をビジネスに応用した概念。",
    example: "Instead of following industry norms, we should reason from first principles about what's actually possible.",
    example_translation: "業界の慣習に従うのではなく、実際に何が可能かを第一原理から考えるべきです。",
    cefr_level: "C1",
    why_hard_for_japanese: "「first principles（第一原理）」というフィロソフィー・物理学の専門用語が一般的でなく、「reason from（〜から推論する）」という構文とあわせて習得が必要な高度な表現。",
  },
  {
    expression: "go all in",
    type: "idiom",
    context: "When I started SpaceX and Tesla at the same time, people thought I was crazy. Both companies almost died. But I had gone all in — I had committed everything I had.",
    context_translation: "SpaceXとテスラを同時に始めたとき、人々は私が狂っていると思いました。両社は死にかけました。しかし私はすべてを賭けていました――持っているすべてを注ぎ込んでいました。",
    meaning_ja: "全力を賭ける、すべてを投入する",
    nuance: "ポーカー用語「all in（全チップを賭ける）」から。リスクを承知でリソース・エネルギー・資金をすべて投入すること。「commit fully」より「退路を断って賭ける」強さがある。",
    example: "If you want to succeed as an entrepreneur, you have to go all in.",
    example_translation: "起業家として成功したいなら、すべてを賭けなければなりません。",
    cefr_level: "B2",
    why_hard_for_japanese: "ポーカー用語としての語源を知らないと意味が分かりにくく、「全力投球する」という日本語の概念との対応も難しい。ゲーム・スポーツ以外の文脈でも頻繁に使われる。",
  },
  {
    expression: "push the envelope",
    type: "idiom",
    context: "My advice to graduates is to work on something that matters. Push the envelope in terms of what's possible. The best companies are those that push the boundaries of technology.",
    context_translation: "卒業生へのアドバイスは、重要なことに取り組むことです。可能性の限界を押し広げてください。最高の会社は技術の境界を押し広げるものです。",
    meaning_ja: "限界に挑戦する、可能性を押し広げる",
    nuance: "もともとは航空工学用語（flight envelope = 航空機の飛行限界範囲）から。既存の限界・基準を超えて新しいことを試みること。「innovate（革新する）」よりアグレッシブな挑戦を示す。",
    example: "This research is pushing the envelope on what we thought was possible in renewable energy.",
    example_translation: "この研究は再生可能エネルギーで可能だと思っていた限界を押し広げています。",
    cefr_level: "C1",
    why_hard_for_japanese: "航空工学の専門用語が語源であることを知らないと意味が全く分からず、「envelope（封筒）を押す」という直訳でも理解できない。この表現は読み書きでも聞き取りでも難しい。",
  },
  {
    expression: "make a dent in",
    type: "collocation",
    context: "I hope that some of you will work to make a dent in the problems that we face as humanity. If we can make a dent in the challenges of sustainable energy and space exploration, it would be remarkable.",
    context_translation: "皆さんのうちの何人かが、人類として直面する問題に変化をもたらすために取り組んでくれることを願います。持続可能エネルギーと宇宙探索の課題に変化をもたらせれば、それは素晴らしいことでしょう。",
    meaning_ja: "〜に変化をもたらす、〜に影響を与える",
    nuance: "大きな問題に対して完全ではなくても「凹み（dent）を作る」、つまり意味ある進歩をもたらすこと。Jobsの「make a dent in the universe」でも有名な表現。",
    example: "One person can't solve climate change, but we can each make a dent in the problem.",
    example_translation: "一人では気候変動を解決できませんが、それぞれが問題に変化をもたらすことはできます。",
    cefr_level: "C1",
    why_hard_for_japanese: "「dent（凹み）を作る」という物理的イメージから「影響を与える・変化をもたらす」という比喩的意味への転換が難しく、日本語に対応する自然な表現がない。",
  },
  {
    expression: "at the frontier of",
    type: "collocation",
    context: "Work at the frontier of knowledge. Be at the frontier of technology. The most impactful companies and people are those operating at the frontier of what is possible.",
    context_translation: "知識の最前線で働いてください。テクノロジーの最前線にいてください。最もインパクトのある企業と人々は、可能性の最前線で活動している人たちです。",
    meaning_ja: "〜の最前線で、〜の先端で",
    nuance: "「frontier（フロンティア・辺境）」は「未開の地・最先端」を意味し、「at the frontier of」で「ある分野の最先端・最前線にいる」という表現。科学・技術・思想の文脈で重要。",
    example: "Researchers at the frontier of AI are encountering questions that no one has had to answer before.",
    example_translation: "AIの最前線にいる研究者たちは、誰も答えたことのない問いに直面しています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「frontier（フロンティア）」はカタカナ語として知られているが、「at the frontier of 〜」という形で「〜の最先端にいる」という意味で使いこなすのは別の習得が必要。",
  },
];

const MUSK_TRANSCRIPT = `Well, thank you. It's an honor to be here. I appreciate the opportunity to speak with this graduating class.

I think there are a couple of things that are worth noting.

One is to think about what are the things that are going to matter. That really have a profound impact. And work to make a dent in those things.

The world faces massive problems. Things like sustainable energy, artificial intelligence, access to education. These are areas where being at the frontier of what's possible really matters.

Second, I think it's very important to have a feedback loop, where you're constantly thinking about what you've done and how you could be doing it better. Most people don't do that. They just keep doing the same thing.

I would also encourage you to reason from first principles rather than by analogy. The normal way we conduct our lives is we reason by analogy. But when you reason from first principles, you build from the ground up.

And finally: be willing to take the plunge. Push the envelope. Go all in on the things that matter.

Starting SpaceX and Tesla simultaneously was perhaps not the wisest thing to do. But they were problems that needed to be solved.

Good luck. And I hope some of you will choose to tackle the problems that really matter.`;

// ─────────────────────────────────────────────────────────────────────────────

const OPRAH_PHRASES: PhraseResult[] = [
  {
    expression: "pay it forward",
    type: "idiom",
    context: "Every one of you has the obligation to pay it forward. You have come this far because somebody believed in you. Now it is your turn to believe in someone else.",
    context_translation: "皆さんには恩を次の人に送る義務があります。あなたがここまで来られたのは、誰かがあなたを信じてくれたからです。今度はあなたが誰かを信じる番です。",
    meaning_ja: "恩を次の人に送る、ペイ・フォワードする",
    nuance: "自分が受けた親切・恩恵を元の人に返すのではなく、別の人に渡すこと。「give back（恩返し）」より「連鎖させる・広める」意味がある。映画「ペイ・フォワード」で広く知られた表現。",
    example: "The scholarship helped me succeed, so now I pay it forward by mentoring young students.",
    example_translation: "奨学金が私の成功を助けてくれたので、今は若い学生をメンタリングすることで恩を送っています。",
    cefr_level: "B2",
    why_hard_for_japanese: "「pay（払う）+ it forward（前へ）」という組み合わせから「恩を次の人に送る」という意味が直感的でなく、概念自体も日本語の「恩返し」とは異なるため習得が難しい。",
  },
  {
    expression: "come into one's own",
    type: "idiom",
    context: "Your journey to success begins the moment you realize who you are and what you were meant to do. That is when you truly come into your own. You discover your authentic power.",
    context_translation: "成功への旅は、自分が何者で何をすることを運命づけられているかに気づいた瞬間に始まります。そのとき初めて本当の自分を発揮できます。自分の本来の力を発見します。",
    meaning_ja: "本領を発揮する、真の姿を現す",
    nuance: "潜在的な能力・才能・個性が十分に開花し、本来の自分らしさが発揮されること。成熟・自己発見の文脈で使われる。「finally become who you are meant to be」に近いニュアンス。",
    example: "She truly came into her own after moving to a new city where no one knew her past.",
    example_translation: "誰も彼女の過去を知らない新しい都市に引っ越してから、彼女は本当の自分を発揮し始めました。",
    cefr_level: "C1",
    why_hard_for_japanese: "「come into（〜に入る）+ one's own（自分のもの）」という構造から「本領を発揮する」という意味が全く連想できず、このイディオムとして丸ごと覚える必要がある。",
    transcriptHighlight: "came into my own",
  },
  {
    expression: "sit with",
    type: "collocation",
    context: "Learn to sit with the discomfort, the uncertainty. Don't try to numb it out or move away from it too quickly. Sit with whatever you're feeling and it will teach you something.",
    context_translation: "不快感・不確かさとともにじっとしていることを学んでください。麻痺させたり早々に逃げようとしたりしないでください。感じていることとともにじっとしてみれば、何かを教えてくれます。",
    meaning_ja: "〜と向き合う、〜を受け入れて共存する",
    nuance: "感情・状況・不確実性から逃げずに「そこにいる」こと。「accept（受け入れる）」より「解決しようとせずに共存する」マインドフルネス的なニュアンス。心理・感情の文脈で頻用される現代的な表現。",
    example: "Try to sit with your feelings of grief rather than suppressing them.",
    example_translation: "悲しみの感情を抑えるのではなく、それとじっと向き合ってみてください。",
    cefr_level: "B2",
    why_hard_for_japanese: "「sit（座る）+ with（〜と）」から「感情と向き合う・共存する」という心理的な意味への転換が難しく、マインドフルネス系の文脈でよく出てくる現代英語の重要表現。",
  },
  {
    expression: "be at one's core",
    type: "collocation",
    context: "What you do at your core — what you are at your core — determines your life's path. At my core, I am a storyteller. At your core, there is a truth that is waiting to be expressed.",
    context_translation: "あなたの核心でする行動――あなたの核心での在り方――が人生の道を決めます。私の核心はストーリーテラーです。あなたの核心には、表現されるのを待っている真実があります。",
    meaning_ja: "本質的に、根本において",
    nuance: "「at its core（本質的に）」の個人版。「basically」よりずっと深く「その人の最も根本・本質的な部分で」を示す。自己分析・アイデンティティの文脈で強く使われる表現。",
    example: "At his core, he is a deeply empathetic person — he just hides it well.",
    example_translation: "彼は本質的に非常に共感力の高い人です――ただうまく隠しているだけです。",
    cefr_level: "B2",
    why_hard_for_japanese: "「core（核・中心）」はIT・科学で馴染みがあるが、「at one's core（その人の本質において）」という感情的・哲学的な用法を日常会話で使いこなすのは難しい。",
    transcriptHighlight: "at the core of",
  },
  {
    expression: "surrender to",
    type: "collocation",
    context: "I have learned to surrender to the idea that I am not in control of everything. When you stop fighting what is and surrender to the flow, life opens up in ways you never imagined.",
    context_translation: "すべてをコントロールできるわけではないという考えに降参することを学びました。現実と戦うのをやめて流れに身を委ねると、想像したことのない形で人生が開けます。",
    meaning_ja: "〜に身を委ねる、〜を受け入れて諦める",
    nuance: "「give up（諦める）」の否定的な意味とは異なり、「戦うことをやめてあるがままを受け入れる」ポジティブな解放感を持つ。マインドフルネス・スピリチュアルな文脈で重要な表現。",
    example: "Sometimes you have to surrender to the process and trust that things will work out.",
    example_translation: "時には過程に身を委ねて、物事がうまくいくと信頼しなければなりません。",
    cefr_level: "C1",
    why_hard_for_japanese: "「surrender（降伏する）」は戦争文脈での「降参」として知られているが、「身を委ねる・あるがままを受け入れる」というポジティブな意味での使い方は日本語話者には習得が難しい。",
  },
  {
    expression: "hold space for",
    type: "idiom",
    context: "One of the greatest gifts you can give another person is to hold space for them. To be fully present. To witness their journey without judgment.",
    context_translation: "他者に与えられる最大の贈り物の一つは、その人のためにスペースを保つことです。完全に存在すること。判断なしにその人の旅を見守ること。",
    meaning_ja: "〜のために存在する、〜を支持して見守る",
    nuance: "物理的・感情的なスペースを作り、相手が安心して自分を表現できる環境を提供すること。「support（支援する）」より「干渉せず、ただそこにいる」受容的なニュアンス。心理・コーチング分野で重要な表現。",
    example: "A good therapist knows how to hold space for their clients without imposing their own judgments.",
    example_translation: "良い治療士は、自分の判断を押し付けることなくクライアントのためにスペースを保つ方法を知っています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「hold space for（〜のためにスペースを保つ）」は心理・コーチング分野で生まれた比較的新しい概念の表現で、日本語に対応する表現がなく概念ごと習得する必要がある。",
  },
];

const OPRAH_TRANSCRIPT = `I'm going to begin with a story.

I grew up in rural poverty. At fourteen, I was sent to live with my father. He demanded that I read a book a week and turn in book reports.

I was so angry. But my father's discipline was the beginning of my liberation.

I know something about the importance of mentors, of people who hold space for you. People who come into your life and give you what you need at the exact right time.

Every one of you has the obligation to pay it forward. Somebody believed in you. Somebody made an investment in you. Now it's your turn.

The key to realizing a dream is to focus not on success but on significance — and then even the small steps and little victories along your path will take on greater meaning.

At the core of my being, I believe I am a storyteller. I came into my own as a storyteller when I stopped trying to be what everyone else wanted me to be.

Learn to sit with the discomfort. Surrender to the uncertainty. Hold space for the possibility that you don't know what your next step is. Because the moment you start moving in the direction of your truth, doors you never even imagined will open.

And whatever you do, remember to pay it forward.`;

// ─────────────────────────────────────────────────────────────────────────────

const DFW_PHRASES: PhraseResult[] = [
  {
    expression: "go on autopilot",
    type: "idiom",
    context: "Everything in my own immediate experience supports my deep belief that I am the absolute center of the universe. But most days, if you're aware enough to give yourself a choice, you can choose to look differently at this. Or not. You can just go on autopilot.",
    context_translation: "私自身の直接の経験はすべて、自分が宇宙の絶対的な中心だという深い信念を支持します。しかしほとんどの日、自分に選択肢を与えられるほど気づいているなら、別の見方をすることを選べます。あるいは選ばないこともできる。ただ自動操縦で進むこともできます。",
    meaning_ja: "自動操縦で動く、無意識に行動する",
    nuance: "意識的な判断なしに習慣・反射で行動すること。飛行機の自動操縦システムから。「act unconsciously（無意識に行動する）」より「思考を停止したまま動き続ける」怠惰・無自覚のニュアンスが強い。",
    example: "Without realizing it, many people spend entire workdays on autopilot.",
    example_translation: "気づかないうちに、多くの人が一日中自動操縦で仕事をしています。",
    cefr_level: "B2",
    why_hard_for_japanese: "「autopilot（自動操縦）」は技術用語として知られているが、「go on autopilot（自動操縦で動く）」という比喩的な日常表現として使いこなすのは別の習得が必要。",
  },
  {
    expression: "default setting",
    type: "idiom",
    context: "There is no experience you've had that you were not at the absolute center of. The world as you experience it is there in front of you. Our default setting is to believe that we are the center of everything.",
    context_translation: "あなたが経験したことで、あなたが絶対的な中心にいなかったものはありません。あなたが経験する世界はあなたの目の前にあります。私たちのデフォルト設定は、すべての中心は自分だと信じることです。",
    meaning_ja: "（比喩）デフォルトの思考・反応パターン",
    nuance: "コンピュータの「初期設定（default setting）」から。意識的に変えない限り無意識に出てくる思考・反応のパターン。DFWはこれを自己中心性の象徴として使っている。",
    example: "Your default setting might be pessimism, but you can train yourself to see things differently.",
    example_translation: "あなたのデフォルト設定は悲観主義かもしれませんが、別の見方をするよう自分を訓練できます。",
    cefr_level: "B2",
    why_hard_for_japanese: "IT用語としての「デフォルト設定」は知られているが、「無意識の思考・行動パターン」という比喩的な意味での使い方は日本語話者には習得が必要。",
  },
  {
    expression: "be attuned to",
    type: "collocation",
    context: "Twenty years after my own graduation, I have come gradually to understand that the liberal arts cliché about teaching you how to think is actually shorthand for a much deeper, more serious idea: learning how to be attuned to what matters.",
    context_translation: "自分の卒業から20年後、教養教育の「考え方を教える」というお決まりの言葉が、実はずっと深い、より本格的な考えの略語であることを徐々に理解してきました：重要なことに敏感でいる方法を学ぶこと。",
    meaning_ja: "〜に敏感になっている、〜に調和している",
    nuance: "楽器のチューニング（attuned）から。感情・状況・他者のニーズに対して「感度が高い・気づける状態にある」こと。「be aware of」より「共鳴・調和」のニュアンスがある。",
    example: "A great leader is attuned to the needs and emotions of the people around them.",
    example_translation: "偉大なリーダーは周りの人々のニーズと感情に敏感です。",
    cefr_level: "C1",
    why_hard_for_japanese: "「attune（調律する）」という動詞が日本語話者には低頻度語で、「be attuned to（〜に敏感・調和している）」という慣用的な使い方を習得するには意識的な練習が必要。",
  },
  {
    expression: "exercise choice",
    type: "collocation",
    context: "The really important kind of freedom involves attention, and awareness, and discipline, and effort, and being able to truly care about other people. The choice is yours to exercise every day.",
    context_translation: "本当に重要な自由は、注意・気づき・規律・努力、そして他者を本当に気にかけることができることを含みます。選択肢はあなたが毎日行使するものです。",
    meaning_ja: "選択権を行使する、意識的に選ぶ",
    nuance: "「make a choice（選択する）」より「能動的・意識的に選択権を使う」というニュアンス。権利・選択・判断を意識して発動させること。法律・哲学の文脈でも使われる。",
    example: "You exercise choice every morning when you decide how to respond to your circumstances.",
    example_translation: "自分の状況にどう反応するかを決めるとき、あなたは毎朝選択権を行使しています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「exercise（練習する・運動する）」の「行使する」という意味が日本語話者には定着しにくく、「exercise choice / exercise power / exercise rights」という使い方を習得するには意識的な努力が必要。",
  },
  {
    expression: "wade through",
    type: "phrasal_verb",
    context: "The day-to-day trenches of adult existence — wading through the checkout line, the crowded aisles, the traffic — this is where the real test of character happens.",
    context_translation: "大人の日常の塹壕――レジの列を進み、混雑した通路を進み、渋滞を進む――これが本当の人格試験が起きる場所です。",
    meaning_ja: "（困難を）ゆっくり進む、苦労しながら〜をこなす",
    nuance: "水・泥の中を歩くイメージから「困難・退屈・大量の何かをゆっくり苦労しながら進む」こと。「go through（通り抜ける）」より「時間・努力がかかる」疲労感がある。",
    example: "I've been wading through hundreds of emails after returning from vacation.",
    example_translation: "休暇から戻ってから何百通ものメールを格闘しながら処理しています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「wade（水の中を歩く）」という単語自体が日本語話者には低頻度で、「wade through（苦労して進む）」という比喩的な困難な状況の進み方を表す表現として習得するのが難しい。",
  },
  {
    expression: "be inured to",
    type: "collocation",
    context: "Twenty years of carefully nurtured resentments toward a boss who never noticed your efforts — this is the freedom of a real education. If you are inured to this kind of boredom, you have chosen to remain unconscious.",
    context_translation: "自分の努力に気づかなかった上司への20年間の丁寧に育てられた恨み――これが本物の教育の自由です。この種の退屈に慣れっこになっているなら、無意識のままでいることを選んでいます。",
    meaning_ja: "〜に慣れっこになっている、〜に鈍感になっている",
    nuance: "繰り返しの経験によって、不快・苦しみ・刺激に対して感覚が麻痺・鈍化した状態。「be used to」より「意識的に選んだわけでもないのに感覚が失われている」という否定的な含みが強い。",
    example: "After years of seeing the same problems ignored, many employees become inured to the dysfunction.",
    example_translation: "何年も同じ問題が放置されるのを見ていると、多くの従業員は機能不全に慣れっこになっていきます。",
    cefr_level: "C2",
    why_hard_for_japanese: "「inure（慣れっこにする）」という単語が非常に低頻度で、日本語話者には馴染みがない。「be used to / be accustomed to」との使い分けも含め、文学的・知的な文章で出てくる高度な語彙。",
  },
];

const DFW_TRANSCRIPT = `There are these two young fish swimming along, and they happen to meet an older fish swimming the other way, who nods at them and says, "Morning, boys. How's the water?" And the two young fish swim on for a bit, and then eventually one of them looks over at the other and goes, "What the hell is water?"

This is a standard requirement of U.S. liberal arts education — the well-known "teaching you how to think." None of us really understand what this cliché means. Probably the most dangerous thing about an academic education — at least in my own case — is that it enables my tendency to over-intellectualize.

Here is just one example of the total wrongness of something I tend to be automatically sure of. Everything in my own immediate experience supports my deep belief that I am the absolute center of the universe. The world as I experience it is right there in front of me.

But most days, if you're aware enough to give yourself a choice, you can choose to look differently at this. Or not. You can just go on autopilot and follow your default setting.

The really important kind of freedom involves attention, and awareness, and discipline. It means being able to truly care about other people. It means being able to exercise choice, consciously.

In the day-to-day trenches of adult life, you wade through boredom and frustration — the checkout line, the crowded aisles, the traffic. If you are inured to this kind of tedium, you have chosen to remain unconscious.

Twenty years after my own graduation, I have come gradually to understand that the liberal arts cliché about "teaching you how to think" is really about learning how to be attuned to what matters — and exercising that choice, consciously, every single day.

This is water. This is water.`;

// ─────────────────────────────────────────────────────────────────────────────

const SAGAN_PHRASES: PhraseResult[] = [
  {
    expression: "hold sway over",
    type: "idiom",
    context: "Our planet is a lonely speck in the great enveloping cosmic dark. In our obscurity, in all this vastness, there is no hint that help will come from elsewhere to save us from ourselves. The pretension that we have some privileged position in the universe is challenged by this pale blue dot. No king has ever held sway over the fate of all beings on this mote of dust.",
    context_translation: "私たちの惑星は、広大な宇宙の暗闇の中の孤独な点です。この広大さの中の無名性において、自分たちを自分たちから救うために外から助けが来るという兆しはありません。この青ざめた青い点は、私たちが宇宙に特権的な地位を持つという思い込みに挑戦します。どの王もこの塵の粒子のすべての存在の運命を支配したことはありません。",
    meaning_ja: "〜を支配する、〜に影響力を持つ",
    nuance: "権力・影響力・権威が特定の領域や人々を「支配する」こと。「rule（統治する）」より「見えない力が広く及んでいる」ニュアンスがある。歴史・政治・文学の文脈で使われる格調高い表現。",
    example: "For centuries, religious doctrine held sway over scientific inquiry.",
    example_translation: "何世紀もの間、宗教的教義が科学的探求を支配していました。",
    cefr_level: "C2",
    why_hard_for_japanese: "「sway（揺れ）」から「支配・影響力」という意味への転換が難しく、「hold sway over（〜を支配する）」という慣用句は文学的・歴史的な文章でしか出てこない高度な表現。",
  },
  {
    expression: "in the aggregate",
    type: "collocation",
    context: "Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, in the aggregate, occurred on a mote of dust suspended in a sunbeam.",
    context_translation: "もう一度あの点を見てください。あそこが、ここです。あそこが、家です。あそこが、私たちです。その上で、あなたが愛するすべての人、あなたが知るすべての人、あなたが聞いたことがあるすべての人、これまで存在したすべての人間が、その人生を生きました。私たちの喜びと苦しみの総体は、日光の中に浮かぶ塵の粒子の上で起きました。",
    meaning_ja: "総体として、全体として見ると",
    nuance: "個々の要素を合計・統合した全体の観点から見ること。統計・社会科学・哲学の文脈でよく使われるアカデミックな表現。「as a whole」より数量的・分析的なニュアンスがある。",
    example: "In the aggregate, small daily choices have a massive impact on health outcomes.",
    example_translation: "総体として見ると、日々の小さな選択が健康アウトカムに大きな影響を与えます。",
    cefr_level: "C1",
    why_hard_for_japanese: "「aggregate（集合体・総量）」という単語がアカデミックな文脈で使われる低頻度語で、「in the aggregate（総体として）」という副詞的用法は特に日本語話者には習得が難しい。",
  },
  {
    expression: "be humbled by",
    type: "collocation",
    context: "Our planet is a very small stage in a vast cosmic arena. Think of the rivers of blood spilled by all those generals and emperors so that, in glory and triumph, they could become the momentary masters of a fraction of a dot. Our posturings are humbled by the vastness of the universe.",
    context_translation: "私たちの惑星は、広大な宇宙の舞台のほんの小さなステージです。点の一部分の一時的な支配者になるために、あれほど多くの将軍・皇帝が流した血の川を考えてみてください。私たちの見栄は、宇宙の広大さによって謙虚にさせられます。",
    meaning_ja: "〜によって謙虚にさせられる",
    nuance: "自分より大きな存在・事実・規模に接して、自らの小ささ・限界を悟ること。「humiliated（屈辱を受ける）」とは異なり、「畏敬とともに謙虚さを感じる」という肯定的・精神的なニュアンスがある。",
    example: "I am truly humbled by the kindness and generosity of this community.",
    example_translation: "このコミュニティの親切さと寛大さに心から謙虚にさせられます。",
    cefr_level: "B2",
    why_hard_for_japanese: "「humble（謙虚にする）」を受動態で「謙虚にさせられる」と使う「be humbled by」の形が日本語話者には作りにくく、スピーチ・授賞式での定型的な表現として習得が必要。",
  },
  {
    expression: "foster delusions of",
    type: "collocation",
    context: "Our planet is a very small stage in a vast cosmic arena. Our imagined self-importance, the delusion that we have some privileged position in the Universe, are challenged by this point of pale light. The cosmos is also within us. We are a way for the universe to know itself. Any attempt to foster delusions of grandeur must be tempered by this pale blue dot.",
    context_translation: "宇宙の広大な舞台における私たちの惑星は非常に小さなステージです。私たちの想像上の自己重要性、宇宙に特権的な地位があるという妄想は、この青白い光の点によって挑戦されます。誇大妄想を育てようとするいかなる試みも、この青ざめた青い点によって和らげられなければなりません。",
    meaning_ja: "〜の妄想を育む・助長する",
    nuance: "「foster（育てる）+ delusions（妄想）+ of（〜の）」という組み合わせ。「delusions of grandeur（誇大妄想）」は特に定型表現として重要。根拠のない誇りや優越感を持ち続けること。",
    example: "Surrounding yourself with only yes-men can foster delusions of infallibility.",
    example_translation: "イエスマンだけに囲まれると、無謬であるという妄想を育てることになります。",
    cefr_level: "C2",
    why_hard_for_japanese: "「foster（育てる）」「delusion（妄想）」「grandeur（壮大さ）」のいずれも日本語話者には低頻度語で、三つの単語を組み合わせた「foster delusions of grandeur」というフレーズは文学的な最高レベルの表現。",
  },
  {
    expression: "be tempered by",
    type: "collocation",
    context: "There is perhaps no better demonstration of the folly of human conceits than this distant image of our tiny world. To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot. Our pretensions must be tempered by this image.",
    context_translation: "この小さな世界の遠い画像ほど、人間の思い上がりの愚かさをよく示すものはないかもしれません。私にとってそれは、互いにより親切に接し、青ざめた青い点を守り大切にする私たちの責任を強調しています。私たちの思い上がりはこの画像によって和らげられなければなりません。",
    meaning_ja: "〜によって和らげられる、〜で緩和される",
    nuance: "金属の「焼き入れ（tempering）」から。強すぎる感情・主張・行動が別の力によって適度に抑制・調整されること。「be moderated by」より「強くなりながらも均衡を保つ」というニュアンス。",
    example: "Ambition is good, but it must be tempered by humility and ethical judgment.",
    example_translation: "野心は良いものですが、謙虚さと倫理的な判断によって和らげられなければなりません。",
    cefr_level: "C2",
    why_hard_for_japanese: "「temper（焼き入れする・和らげる）」という金属加工から来る動詞が日本語話者には馴染みがなく、「be tempered by（〜によって和らげられる）」という受動態の使い方も含め、最高レベルの習得が必要な語彙。",
  },
  {
    expression: "underscore",
    type: "collocation",
    context: "To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the only home we've ever known.",
    context_translation: "私にとってそれは、互いにより親切に接し、私たちがこれまで知っている唯一の家を守り大切にする私たちの責任を強調しています。",
    meaning_ja: "〜を強調する、〜を際立たせる",
    nuance: "「emphasize（強調する）」の同義語だが、よりフォーマルで書き言葉的。下線を引くイメージから重要性を際立たせること。ニュース・研究・政策文書でよく使われる。",
    example: "These findings underscore the urgent need for policy reform.",
    example_translation: "これらの発見は政策改革の緊急の必要性を強調しています。",
    cefr_level: "C1",
    why_hard_for_japanese: "「underscore（下線を引く）」という意味は知っていても、「強調する・際立たせる」という動詞としての用法がフォーマルな文章で使われることを知らない学習者が多い。",
  },
];

const SAGAN_TRANSCRIPT = `We succeeded in taking that picture, and, if you look at it, you see a dot. That's here. That's home. That's us.

On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, inventor and explorer, every teacher of morals, every corrupt politician, every "superstar," every "supreme leader," every saint and sinner in the history of our species lived there — on a mote of dust suspended in a sunbeam.

The Earth is a very small stage in a vast cosmic arena. Think of the rivers of blood spilled by all those generals and emperors so that, in glory and triumph, they could become the momentary masters of a fraction of a dot.

Our planet is a lonely speck in the great enveloping cosmic dark. In our obscurity, in all this vastness, there is no hint that help will come from elsewhere to save us from ourselves.

The Earth is the only world known so far to harbor life. There is nowhere else, at least in the near future, to which our species could migrate.

No king has ever held sway over the fate of all beings on this mote of dust. Any attempt to foster delusions of grandeur is challenged by this image. Our pretensions must be tempered by this pale blue dot.

To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot, the only home we've ever known.`;

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
  {
    slug: "matt-cutts-ted",
    emoji: "📅",
    title: "Matt Cutts · 30日間チャレンジ",
    sublabel: "TED · 2011",
    cefrRange: "A1 〜 A2",
    cefrRangeLabel: "入門〜初級",
    url: "https://www.youtube.com/watch?v=JnfBXjWm7hc",
    pageTitle: "Matt Cutts TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Matt Cutts の3分間TED Talk。ゆっくり明瞭な英語でA1〜A2レベルの学習者に最適。日常で使える基本フレーズを厳選しました。",
    overallLevel: "A1",
    phrases: MATT_CUTTS_PHRASES,
    transcript: MATT_CUTTS_TRANSCRIPT,
  },
  {
    slug: "malala-un-2013",
    emoji: "✏️",
    title: "Malala Yousafzai · 国連スピーチ",
    sublabel: "国連 · 2013",
    cefrRange: "A1 〜 A2",
    cefrRangeLabel: "入門〜初級",
    url: "https://www.youtube.com/watch?v=3rNhZu3ttIU",
    pageTitle: "Malala 国連スピーチ で学ぶ英語表現 | LinguistLens",
    description: "Malala Yousafzai が国連で行った伝説のスピーチ。平易で力強い英語から、A1〜A2レベルの基礎フレーズを厳選しました。",
    overallLevel: "A1",
    phrases: MALALA_PHRASES,
    transcript: MALALA_TRANSCRIPT,
  },
  {
    slug: "mcgonigal-stress-ted",
    emoji: "💪",
    title: "Kelly McGonigal · ストレスを友にする方法",
    sublabel: "TED · 2013",
    cefrRange: "A2 〜 B1",
    cefrRangeLabel: "初級〜中級",
    url: "https://www.youtube.com/watch?v=RcGyVTAoXEU",
    pageTitle: "Kelly McGonigal TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Kelly McGonigal の人気TED Talk。心理学・健康系の英語表現をA2〜B1レベルで学べます。",
    overallLevel: "A2",
    phrases: MCGONIGAL_PHRASES,
    transcript: MCGONIGAL_TRANSCRIPT,
  },
  {
    slug: "achor-happy-ted",
    emoji: "😊",
    title: "Shawn Achor · 幸福と成功の意外な関係",
    sublabel: "TED · 2011",
    cefrRange: "A2 〜 B1",
    cefrRangeLabel: "初級〜中級",
    url: "https://www.youtube.com/watch?v=GXy__kBVq1M",
    pageTitle: "Shawn Achor TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Shawn Achor のユーモラスなTED Talk。ポジティブ心理学の英語表現をA2〜B1レベルで解説します。",
    overallLevel: "A2",
    phrases: ACHOR_PHRASES,
    transcript: ACHOR_TRANSCRIPT,
  },
  {
    slug: "robinson-schools-ted",
    emoji: "🎨",
    title: "Ken Robinson · 学校は創造性を殺すのか？",
    sublabel: "TED · 2006",
    cefrRange: "B1 〜 B2",
    cefrRangeLabel: "中級〜中上級",
    url: "https://www.youtube.com/watch?v=iG9CE55wbtY",
    pageTitle: "Ken Robinson TED Talk で学ぶ英語表現 | LinguistLens",
    description: "TED史上最も視聴されたTED Talk。Ken Robinson の流暢でユーモアある英語から、B1〜B2レベルの必須フレーズを厳選しました。",
    overallLevel: "B1",
    phrases: ROBINSON_PHRASES,
    transcript: ROBINSON_TRANSCRIPT,
  },
  {
    slug: "brene-brown-ted",
    emoji: "🤍",
    title: "Brené Brown · 傷つく心の力",
    sublabel: "TED · 2010",
    cefrRange: "B1 〜 B2",
    cefrRangeLabel: "中級〜中上級",
    url: "https://www.youtube.com/watch?v=iCvmsMzlF7o",
    pageTitle: "Brené Brown TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Brené Brown の「脆弱性の力」TED Talk。感情・人間関係に関する深い英語表現をB1〜B2レベルで解説します。",
    overallLevel: "B1",
    phrases: BRENE_BROWN_PHRASES,
    transcript: BRENE_BROWN_TRANSCRIPT,
  },
  {
    slug: "cuddy-body-language-ted",
    emoji: "🧍",
    title: "Amy Cuddy · ボディランゲージが自分を変える",
    sublabel: "TED · 2012",
    cefrRange: "A2 〜 B1",
    cefrRangeLabel: "初級〜中級",
    url: "https://www.youtube.com/watch?v=Ks-_Mh1QhMc",
    pageTitle: "Amy Cuddy TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Amy Cuddy の「パワーポーズ」TED Talk。心理学・自己表現の英語表現をA2〜B1レベルで学べます。",
    overallLevel: "B1",
    phrases: CUDDY_PHRASES,
    transcript: CUDDY_TRANSCRIPT,
  },
  {
    slug: "gilbert-genius-ted",
    emoji: "✨",
    title: "Elizabeth Gilbert · 創造性の本質",
    sublabel: "TED · 2009",
    cefrRange: "B1 〜 B2",
    cefrRangeLabel: "中級〜中上級",
    url: "https://www.youtube.com/watch?v=86x-u-tz0MA",
    pageTitle: "Elizabeth Gilbert TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Elizabeth Gilbert の創造性についてのTED Talk。芸術・感情・人生観の英語表現をB1〜B2レベルで解説します。",
    overallLevel: "B1",
    phrases: GILBERT_PHRASES,
    transcript: GILBERT_TRANSCRIPT,
  },
  {
    slug: "adichie-single-story-ted",
    emoji: "📖",
    title: "Chimamanda Adichie · ひとつの物語の危険性",
    sublabel: "TED · 2009",
    cefrRange: "B1 〜 B2",
    cefrRangeLabel: "中級〜中上級",
    url: "https://www.youtube.com/watch?v=D9Ihs241zeg",
    pageTitle: "Chimamanda Adichie TED Talk で学ぶ英語表現 | LinguistLens",
    description: "Chimamanda Adichie の「ひとつの物語の危険性」TED Talk。文化・社会・多様性に関する深い英語表現をB1〜B2レベルで解説します。",
    overallLevel: "B2",
    phrases: ADICHIE_PHRASES,
    transcript: ADICHIE_TRANSCRIPT,
  },
  {
    slug: "rowling-harvard-2008",
    emoji: "⚡",
    title: "J.K. Rowling · ハーバード卒業式スピーチ",
    sublabel: "Harvard · 2008",
    cefrRange: "B2 〜 C1",
    cefrRangeLabel: "中上級〜上級",
    url: "https://www.youtube.com/watch?v=wHGqp8lz36c",
    pageTitle: "J.K. Rowling Harvard スピーチ で学ぶ英語表現 | LinguistLens",
    description: "J.K. Rowling が2008年ハーバード卒業式で行ったスピーチ。失敗と想像力について語るB2〜C1レベルの表現を解説します。",
    overallLevel: "B2",
    phrases: ROWLING_PHRASES,
    transcript: ROWLING_TRANSCRIPT,
  },
  {
    slug: "michelle-obama-dnc-2016",
    emoji: "🇺🇸",
    title: "Michelle Obama · DNC 基調演説",
    sublabel: "DNC · 2016",
    cefrRange: "B1 〜 B2",
    cefrRangeLabel: "中級〜中上級",
    url: "https://www.youtube.com/watch?v=4ZNWYqDU948",
    pageTitle: "Michelle Obama DNC スピーチ で学ぶ英語表現 | LinguistLens",
    description: "Michelle Obama の力強いDNC基調演説。明瞭で感情的な英語からB1〜B2レベルの必須フレーズを厳選しました。",
    overallLevel: "B2",
    phrases: MICHELLE_OBAMA_PHRASES,
    transcript: MICHELLE_OBAMA_TRANSCRIPT,
  },
  {
    slug: "pausch-last-lecture",
    emoji: "🧱",
    title: "Randy Pausch · 最後の授業",
    sublabel: "Carnegie Mellon · 2007",
    cefrRange: "B2 〜 C1",
    cefrRangeLabel: "中上級〜上級",
    url: "https://www.youtube.com/watch?v=ji5_MqicxSo",
    pageTitle: "Randy Pausch Last Lecture で学ぶ英語表現 | LinguistLens",
    description: "Randy Pausch の伝説の「最後の授業」。夢・壁・人生について語るB2〜C1レベルの深い英語表現を解説します。",
    overallLevel: "B2",
    phrases: PAUSCH_PHRASES,
    transcript: PAUSCH_TRANSCRIPT,
  },
  {
    slug: "obama-farewell-2017",
    emoji: "🎙️",
    title: "Barack Obama · 告別演説",
    sublabel: "Chicago · 2017",
    cefrRange: "C1 〜 C2",
    cefrRangeLabel: "上級〜熟達",
    url: "https://www.youtube.com/watch?v=-ttWOx4hg48",
    pageTitle: "Barack Obama 告別演説 で学ぶ英語表現 | LinguistLens",
    description: "Barack Obama の2017年告別演説。格調高い政治英語のフレーズをC1〜C2レベルで解説します。",
    overallLevel: "C1",
    phrases: OBAMA_FAREWELL_PHRASES,
    transcript: OBAMA_FAREWELL_TRANSCRIPT,
  },
  {
    slug: "musk-usc-2014",
    emoji: "🚀",
    title: "Elon Musk · USC 卒業式スピーチ",
    sublabel: "USC · 2014",
    cefrRange: "B2 〜 C1",
    cefrRangeLabel: "中上級〜上級",
    url: "https://www.youtube.com/watch?v=e5AwNU3Y2es",
    pageTitle: "Elon Musk USC スピーチ で学ぶ英語表現 | LinguistLens",
    description: "Elon Musk の USC 卒業式スピーチ。起業・イノベーション・挑戦に関するB2〜C1レベルの英語表現を解説します。",
    overallLevel: "C1",
    phrases: MUSK_PHRASES,
    transcript: MUSK_TRANSCRIPT,
  },
  {
    slug: "oprah-stanford-2008",
    emoji: "🌟",
    title: "Oprah Winfrey · Stanford 卒業式スピーチ",
    sublabel: "Stanford · 2008",
    cefrRange: "B2 〜 C1",
    cefrRangeLabel: "中上級〜上級",
    url: "https://www.youtube.com/watch?v=fgCCFnuEnfM",
    pageTitle: "Oprah Winfrey Stanford スピーチ で学ぶ英語表現 | LinguistLens",
    description: "Oprah Winfrey の Stanford 卒業式スピーチ。人生・感情・成長に関するB2〜C1レベルの深い英語表現を解説します。",
    overallLevel: "C1",
    phrases: OPRAH_PHRASES,
    transcript: OPRAH_TRANSCRIPT,
  },
  {
    slug: "dfw-this-is-water",
    emoji: "💧",
    title: "David Foster Wallace · This is Water",
    sublabel: "Kenyon · 2005",
    cefrRange: "C1 〜 C2",
    cefrRangeLabel: "上級〜熟達",
    url: "https://www.youtube.com/watch?v=8CrOL-ydFMI",
    pageTitle: "David Foster Wallace This is Water で学ぶ英語表現 | LinguistLens",
    description: "David Foster Wallace の哲学的な卒業式スピーチ「This is Water」。意識・選択・日常に関するC1〜C2レベルの高度な英語表現を解説します。",
    overallLevel: "C2",
    phrases: DFW_PHRASES,
    transcript: DFW_TRANSCRIPT,
  },
  {
    slug: "sagan-pale-blue-dot",
    emoji: "🔭",
    title: "Carl Sagan · 青ざめた青い点",
    sublabel: "NASA · 1990",
    cefrRange: "C1 〜 C2",
    cefrRangeLabel: "上級〜熟達",
    url: "https://www.youtube.com/watch?v=wupToqz1e2g",
    pageTitle: "Carl Sagan Pale Blue Dot で学ぶ英語表現 | LinguistLens",
    description: "Carl Sagan の「Pale Blue Dot」スピーチ。天文学・哲学・人類に関するC1〜C2レベルの知的英語表現を解説します。",
    overallLevel: "C2",
    phrases: SAGAN_PHRASES,
    transcript: SAGAN_TRANSCRIPT,
  },
];
