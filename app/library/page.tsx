"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Check,
  AlertTriangle,
  X,
  Lightbulb,
  Zap,
  Shuffle,
  Search,
  Lock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { GlobalNav } from "@/components/global-nav";
import type { ExpressionType } from "@/lib/types";
import { savePhrase, getVocabulary } from "@/lib/vocabulary";
import { getSettings } from "@/lib/settings";
import {
  registerWaitlistLoggedInAction,
  registerWaitlistGuestAction,
} from "@/app/actions/waitlist";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LibraryEntry {
  id: string;
  expression: string;
  type: ExpressionType;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  meaning_ja: string;
  coreImage: string;
  nuance: string;
  badExample?: string;
  warnExample?: string;
  warnNote?: string;
  goodExample: string;
  goodExampleJa: string;
  context: string;
  why_hard_for_japanese: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LIBRARY: LibraryEntry[] = [
  // ── A1 ──────────────────────────────────────────────────────────────────
  {
    id: "a1-01",
    expression: "Can I have...?",
    type: "grammar_pattern",
    level: "A1",
    meaning_ja: "〜をいただけますか？（丁寧な依頼・注文）",
    coreImage: "「私にもらえる？」という許可を求める柔らかいお願い",
    nuance:
      "「Give me...」は命令口調で失礼に聞こえることがある。「Can I have...?」は許可を求める形で、丁寧かつ自然。カフェ・レストラン・会議でも使える万能表現。",
    badExample: "Give me a coffee.",
    goodExample: "Can I have a coffee, please?",
    goodExampleJa: "コーヒーをいただけますか？",
    context: "注文・お願い・何かを受け取りたいとき全般",
    why_hard_for_japanese:
      "「Please give me...」を直訳で使いがち。「Can I have」は許可を求める形式だが、実質的にお願いとして機能する英語の慣習を知っておきたい。",
  },
  {
    id: "a1-02",
    expression: "I'd like to...",
    type: "grammar_pattern",
    level: "A1",
    meaning_ja: "〜したいのですが（丁寧な希望・意志）",
    coreImage: "「would like」は want の丁寧バージョン。意志を柔らかく伝える",
    nuance:
      "「I want to...」は日常会話では普通だが、フォーマルな場面や初対面では「I'd like to...」の方が礼儀正しく聞こえる。レストラン・ビジネスシーン必須。",
    badExample: "I want to make a reservation.",
    goodExample: "I'd like to make a reservation for two, please.",
    goodExampleJa: "2名で予約をしたいのですが。",
    context: "予約・注文・丁寧なお願いをするとき",
    why_hard_for_japanese:
      "「I want」を直訳で使ってしまう。「I'd like」の短縮形を自然に使えると一気に印象が変わる。",
  },
  {
    id: "a1-03",
    expression: "Excuse me vs Sorry",
    type: "idiom",
    level: "A1",
    meaning_ja: "すみません（注意を引く）vs ごめんなさい（謝罪）",
    coreImage: "Excuse me = 邪魔する前の一声 / Sorry = 迷惑をかけた後の謝罪",
    nuance:
      "「Excuse me」は通り道を確保するとき・店員を呼ぶとき・聞き返すときなど「これから邪魔します」のサイン。「Sorry」は実際にぶつかった・迷惑をかけた後の謝罪。日本語の「すみません」が両方に対応するため混乱しやすい。",
    badExample: "Sorry, can I get past?（まだ通っていないのに）",
    goodExample: "Excuse me, could I get past? / Sorry, I didn't mean to bump into you.",
    goodExampleJa: "すみません、通してもらえますか？ / ぶつかってしまってごめんなさい。",
    context: "道で人を呼び止めるとき・通り道を確保するとき・謝罪するとき",
    why_hard_for_japanese:
      "日本語の「すみません」が謝罪にも注意喚起にも使えるため、英語での使い分けが曖昧になりやすい。",
  },
  {
    id: "a1-04",
    expression: "Never mind",
    type: "idiom",
    level: "A1",
    meaning_ja: "気にしないで・もういいです・大丈夫です",
    coreImage: "心（mind）にかけなくていい（never）→ 気にするな",
    nuance:
      "相手に気を使わせたくないとき・自分のお願いを取り消したいとき・「さっきのは忘れて」と言いたいときに使う。文脈によってはやや突き放した印象になることもある。",
    badExample: "It's okay, don't worry about it.（長い）",
    goodExample: "Oh, never mind. I found it myself!",
    goodExampleJa: "あ、気にしないで。自分で見つけたから！",
    context: "お願いを取り消すとき・相手を気遣いたくないとき・気軽な会話",
    why_hard_for_japanese:
      "「Never」＋「mind」の組み合わせが「絶対に心配するな」に聞こえて使いづらく感じる人が多い。実際はとてもカジュアルで気軽なフレーズ。",
  },
  {
    id: "a1-05",
    expression: "No problem / No worries",
    type: "idiom",
    level: "A1",
    meaning_ja: "どういたしまして・大丈夫ですよ",
    coreImage: "問題（problem）も心配（worries）もない→ 全然OK",
    nuance:
      "「You're welcome」は少し形式的。日常会話では「No problem」「No worries」の方がよく使われる。お礼を言われたとき・謝られたとき両方に使える。",
    badExample: "You're welcome.（やや古風・フォーマルに聞こえる場合も）",
    goodExample: "No problem at all! Happy to help.",
    goodExampleJa: "全然大丈夫ですよ！喜んでお手伝いします。",
    context: "感謝・謝罪に対してカジュアルに返すとき",
    why_hard_for_japanese:
      "「You're welcome」しか知らない人が多い。ネイティブは日常的に「No problem」「No worries」「Of course」などを好んで使う。",
  },
  {
    id: "a1-06",
    expression: "What do you mean?",
    type: "grammar_pattern",
    level: "A1",
    meaning_ja: "どういう意味ですか？",
    coreImage: "「あなたが意味する（mean）ことは何（what）？」という直接的な確認",
    nuance:
      "相手の発言が理解できなかったとき・意図を確かめたいときに使う。「Pardon?」より能動的で、「意味を教えてほしい」という積極的な姿勢が伝わる。",
    badExample: "What?",
    goodExample: "What do you mean by that? Could you explain?",
    goodExampleJa: "それはどういう意味ですか？説明してもらえますか？",
    context: "相手の発言が不明瞭なとき・意図を確認したいとき",
    why_hard_for_japanese:
      "「What?」と単語1つで返してしまいがち。「What do you mean?」を使うと理解しようとしている誠意が伝わる。",
  },
  {
    id: "a1-07",
    expression: "Could you say that again?",
    type: "grammar_pattern",
    level: "A1",
    meaning_ja: "もう一度言っていただけますか？",
    coreImage: "「もう一度（again）言う（say）ことができますか（could you）？」",
    nuance:
      "「Repeat」より自然でやわらか。「Could you」で始まることで丁寧さが増す。「Sorry?」だけでも聞き返せるが、「Could you say that again?」の方が意図が明確に伝わる。",
    badExample: "Repeat, please.",
    goodExample: "Sorry, could you say that again? I didn't quite catch that.",
    goodExampleJa: "すみません、もう一度言っていただけますか？聞き取れなかったので。",
    context: "聞き取れなかったとき・外国語での会話・電話",
    why_hard_for_japanese:
      "「Please repeat」と直訳しがち。「Could you say that again?」や「Could you speak more slowly?」のパターンを覚えておくと便利。",
  },
  {
    id: "a1-08",
    expression: "Take your time",
    type: "idiom",
    level: "A1",
    meaning_ja: "ゆっくりどうぞ・急がなくていいですよ",
    coreImage: "時間（time）を自分のものとして（your）使う（take）→ 急がなくていい",
    nuance:
      "相手を急かさず、余裕を持って行動してほしいときに使う。「Don't rush」より温かく、気遣いのある表現。サービス業や日常会話で幅広く使える。",
    badExample: "Don't rush.",
    goodExample: "Take your time. There's no hurry.",
    goodExampleJa: "ゆっくりどうぞ。急ぎませんよ。",
    context: "相手を待っているとき・急かしたくないとき・親切な声かけ",
    why_hard_for_japanese:
      "「Take」+「your time」の組み合わせが直感的ではない。「急がなくていい」を英語でどう言うか知っているだけでコミュニケーションがぐっと円滑になる。",
  },
  {
    id: "a1-09",
    expression: "Let me know",
    type: "grammar_pattern",
    level: "A1",
    meaning_ja: "（後で）教えてください・知らせてください",
    coreImage: "私に（me）知らせる（know）状態にさせて（let）",
    nuance:
      "「Tell me」より柔らかく依頼的。「Let me know if you need anything.」「Let me know what you think.」など、後でフィードバックや情報をもらうときの定番フレーズ。",
    badExample: "Tell me if you have questions.",
    goodExample: "Let me know if you have any questions or concerns.",
    goodExampleJa: "ご質問やご不明な点があればお知らせください。",
    context: "メール・会話の締め・フォローアップの依頼",
    why_hard_for_japanese:
      "「Please tell me」で代替しがちだが、「Let me know」の方が自然でよく使われる。ビジネスメールの締めの定番として覚えておきたい。",
  },
  {
    id: "a1-10",
    expression: "Hang out",
    type: "phrasal_verb",
    level: "A1",
    meaning_ja: "（友達と）過ごす・遊ぶ・つるむ",
    coreImage: "外（out）にぶら下がる（hang）→ 気ままに時間を過ごす",
    nuance:
      "特定の活動ではなく「一緒に気ままに時間を過ごす」ニュアンス。「play」は子供向けの印象。大人が友達と遊ぶときは「hang out」を使う。",
    badExample: "Do you want to play this weekend?",
    goodExample: "Do you want to hang out this weekend?",
    goodExampleJa: "今週末、一緒に遊ばない？",
    context: "友人・知人を誘うとき・カジュアルな約束",
    why_hard_for_japanese:
      "大人が「play」を使うと子供っぽく聞こえる。「hang out」「get together」「catch up」などを状況に応じて使い分けられると自然。",
  },

  // ── A2 ──────────────────────────────────────────────────────────────────
  {
    id: "a2-01",
    expression: "Figure out",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "理解する・解決する・答えを見つけ出す",
    coreImage: "形（figure）を外（out）に出す → もやがかかった状態から答えを引き出す",
    nuance:
      "「understand」や「solve」より「頭を使って考え抜いた」ニュアンスが強い。「I can't figure it out.」「Let me figure this out.」のパターンが日常的によく使われる。",
    badExample: "I can't understand this problem.",
    goodExample: "I've been trying to figure out why the app keeps crashing.",
    goodExampleJa: "なぜアプリがクラッシュし続けるのか、ずっと原因を探っています。",
    context: "問題解決・謎解き・複雑なことを考えるとき",
    why_hard_for_japanese:
      "「understand」で代替しがちだが、「figure out」は試行錯誤して答えにたどり着く過程のニュアンスがある。",
  },
  {
    id: "a2-02",
    expression: "Find out",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "（調べて・聞いて）わかる・知る",
    coreImage: "外（out）に出て（find）情報を発見する",
    nuance:
      "「know」は既に知っている状態。「find out」は「調べたり聞いたりして初めてわかった」発見のニュアンス。「I found out that...」は「〜ということが判明した」という重要な報告に使われる。",
    badExample: "I knew the meeting was cancelled.",
    goodExample: "I just found out the meeting was cancelled. Did you know?",
    goodExampleJa: "会議がキャンセルになったって今知ったよ。知ってた？",
    context: "新しい情報を得たとき・調査の結果を伝えるとき",
    why_hard_for_japanese:
      "「know」と「find out」の区別が曖昧な人が多い。発見の瞬間があるかどうかで使い分ける。",
  },
  {
    id: "a2-03",
    expression: "Get along (with)",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "〜と仲良くやっていく・うまくやる",
    coreImage: "一緒に（along）進んでいく（get）→ 関係がスムーズに続く",
    nuance:
      "「be friends with」より「関係がうまくいっている」過程のニュアンスが強い。職場・家族・ルームメイトとの関係を語るときに頻出。「Do you get along with your coworkers?」が定番。",
    badExample: "I am friends with my boss.",
    goodExample: "I get along really well with my coworkers.",
    goodExampleJa: "同僚たちととても仲良くやっています。",
    context: "人間関係・職場・家族・友人関係を語るとき",
    why_hard_for_japanese:
      "「be friendly」や「be good with」を使いがちだが、「get along with」はより自然な英語表現。",
  },
  {
    id: "a2-04",
    expression: "End up",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "結局〜になる・気づいたら〜していた",
    coreImage: "終わり（end）に上（up）へと到達する → 最終的な結果にたどり着く",
    nuance:
      "計画とは違う・予想外の結果になったことを表すことが多い。「end up -ing」の形が基本。「I ended up staying until midnight.」（気づいたら深夜まで残ってた）のような後日談でよく使う。",
    badExample: "Finally I stayed until midnight.",
    goodExample: "I only meant to stay for an hour, but I ended up staying until midnight.",
    goodExampleJa: "1時間だけのつもりだったのに、気づいたら深夜まで残ってた。",
    context: "予想外の結果・計画とは違った展開を話すとき",
    why_hard_for_japanese:
      "「finally」や「in the end」で代替しがちだが、「end up」は「思わずそうなった」意外性のニュアンスが独特。",
  },
  {
    id: "a2-05",
    expression: "Run out of",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "〜を使い果たす・〜がなくなる",
    coreImage: "外（out）へ走り出て（run）しまう → 中身が空になる",
    nuance:
      "時間・お金・在庫・体力など、あらゆるものに使える。「I ran out of time.」「We're running out of coffee.」などが定番。「run out」だけでも使えるが「run out of ＋名詞」の形が基本。",
    badExample: "I don't have time anymore.",
    goodExample: "Sorry, I'm running out of time. Can we talk later?",
    goodExampleJa: "ごめん、時間がなくなってきた。後で話せる？",
    context: "時間・お金・在庫・エネルギーが尽きるとき",
    why_hard_for_japanese:
      "「don't have」で代替しがちだが、「run out of」は「残り少なくなって底をついていく」過程のニュアンスがある。",
  },
  {
    id: "a2-06",
    expression: "Keep in touch",
    type: "idiom",
    level: "A2",
    meaning_ja: "連絡を取り続ける・またね",
    coreImage: "触れている（touch）状態を保ち続ける（keep）→ つながりを維持する",
    nuance:
      "別れ際に「また連絡しよう」と言うときの定番フレーズ。「Stay in touch」も同じ意味でよく使われる。「Let's keep in touch!」はメールや SNS でのつながりを維持することも含む。",
    badExample: "Let's contact again.",
    goodExample: "It was great catching up! Let's keep in touch.",
    goodExampleJa: "久しぶりに話せてよかった！また連絡しよう。",
    context: "別れ際・異動・引越し・交流会の締め",
    why_hard_for_japanese:
      "「contact」を使いがちだが、「keep in touch」の方が温かく継続的なニュアンスがあり、別れの挨拶として定着している。",
  },
  {
    id: "a2-07",
    expression: "Catch up",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "（遅れを）追いつく・近況を話し合う",
    coreImage: "上（up）に向かって捕まえる（catch）→ 差を埋めて追いつく",
    nuance:
      "「追いつく」（物理的・比喩的）と「近況報告する」の2つの意味がある。「We should catch up sometime!」（近いうちに近況話そう！）は友人との再会でよく使われる表現。",
    goodExample: "We haven't talked in ages. We should catch up over coffee!",
    goodExampleJa: "久しぶりだね。コーヒーでも飲みながら近況話そうよ！",
    context: "友人との再会・仕事の遅れを取り戻すとき・近況報告",
    why_hard_for_japanese:
      "「追いつく」の意味は知っていても、「近況を話す」の意味で使いこなせる人は少ない。",
  },
  {
    id: "a2-08",
    expression: "Break down",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "故障する・（精神的に）崩れ落ちる・分解する",
    coreImage: "下（down）へと壊れていく（break）→ 機能が失われる",
    nuance:
      "車・機械が「故障する」、人が「泣き崩れる・感情的に崩れる」、複雑な情報を「分解して説明する」の3つの意味を持つ多義的なフレーズ。",
    badExample: "My car got broken.",
    goodExample: "My car broke down on the highway. / She broke down in tears.",
    goodExampleJa: "高速道路で車が故障した。/ 彼女は泣き崩れた。",
    context: "機械のトラブル・感情表現・複雑な情報の整理",
    why_hard_for_japanese:
      "「broken」と「break down」の違いが曖昧になりやすい。「broke down」は動作・過程を表し、「broken」は状態を表す。",
  },
  {
    id: "a2-09",
    expression: "Take turns",
    type: "collocation",
    level: "A2",
    meaning_ja: "交代でやる・順番にやる",
    coreImage: "順番（turns）を取って（take）交代する",
    nuance:
      "ゲーム・作業・発言など、順番を守って交代するときに使う。「We take turns cooking.」（交代で料理する）のように習慣的な交代にもよく使われる。",
    badExample: "We do it one by one.",
    goodExample: "Let's take turns presenting our ideas.",
    goodExampleJa: "交代でアイデアを発表しましょう。",
    context: "ゲーム・発表・作業を順番に行うとき",
    why_hard_for_japanese:
      "「one by one」や「in order」を使いがちだが、「take turns」の方がシンプルで自然。",
  },
  {
    id: "a2-10",
    expression: "Give up",
    type: "phrasal_verb",
    level: "A2",
    meaning_ja: "諦める・やめる・手放す",
    coreImage: "上（up）へと与えてしまう（give）→ 自分のものでなくなる",
    nuance:
      "「quit」より「諦めて手放す」ニュアンスが強い。「Don't give up!」は励ましの定番。「give up on someone/something」（〜を見捨てる・諦める）の形もよく使われる。",
    badExample: "Don't stop!",
    goodExample: "Don't give up! You're so close to finishing.",
    goodExampleJa: "諦めないで！もうすぐ終わるよ。",
    context: "励まし・挑戦・諦めの気持ちを表現するとき",
    why_hard_for_japanese:
      "「give」+「up」で「諦める」という意味は意外に感じる。コアイメージ（自分のものを上へ渡してしまう）を掴むと忘れにくい。",
  },

  // ── B1 ──────────────────────────────────────────────────────────────────
  {
    id: "b1-01",
    expression: "Work out",
    type: "phrasal_verb",
    level: "B1",
    meaning_ja: "うまくいく・解決する・（運動で）体を鍛える",
    coreImage: "外（out）に向かって形を成していく",
    nuance:
      "「work out」は「外に向かって結果が出ていく」コアイメージを持つ。物事が予定通りに進み「うまくいく」、問題が「形になっていく」、または体を外に向けて動かす「運動する」の3つの意味を持つ。",
    badExample: "Everything will be good.",
    goodExample: "Don't worry, everything will work out.",
    goodExampleJa: "大丈夫、きっとうまくいくよ。",
    context: "友人への励まし・仕事や計画の見通しを話すとき",
    why_hard_for_japanese:
      "「good」や「fine」で表現してしまいがち。「work out」は問題が解決に向けて動いている過程を含む動的なニュアンスがある。",
  },
  {
    id: "b1-02",
    expression: "Look forward to -ing",
    type: "grammar_pattern",
    level: "B1",
    meaning_ja: "〜を楽しみにしている",
    coreImage: "前（forward）を向いてそれ（to）を見ている期待感",
    nuance:
      "「to」は前置詞なので後ろは名詞か動名詞（-ing）が必須。ビジネスメールの締め・再会の挨拶で頻繁に使われる定番フレーズ。",
    warnExample: "I look forward to see you.",
    warnNote: "「to」の後は必ず名詞か -ing 形",
    goodExample: "I look forward to seeing you next week.",
    goodExampleJa: "来週お会いできるのを楽しみにしています。",
    context: "ビジネスメールの締め・再会の約束・イベントへの期待を伝えるとき",
    why_hard_for_japanese:
      "「to」の後は動詞の原形というルールが頭に刷り込まれているため -ing を忘れがち。",
  },
  {
    id: "b1-03",
    expression: "Get used to",
    type: "phrasal_verb",
    level: "B1",
    meaning_ja: "〜に慣れていく（過程）",
    coreImage: "新しい状態（used to）へとなっていく（get）変化",
    nuance:
      "「be used to」（慣れている状態）と「get used to」（慣れていく過程）の区別が重要。後者は変化の過程を表し、「まだ完全には慣れていないが慣れてきている」ニュアンス。",
    badExample: "I'm familiar with the new environment.",
    goodExample: "I'm getting used to working from home.",
    goodExampleJa: "在宅勤務に慣れてきました。",
    context: "新しい環境・仕事・習慣に徐々に適応していることを表すとき",
    why_hard_for_japanese:
      "「be used to」と「get used to」の使い分けが曖昧なまま使っている人が多い。状態か変化かを意識すると使いこなせる。",
  },
  {
    id: "b1-04",
    expression: "How come?",
    type: "idiom",
    level: "B1",
    meaning_ja: "どうして？（驚きを含む、やわらかい問いかけ）",
    coreImage: "「どんな経緯（come）でそうなったの？」という問いかけ",
    nuance:
      "「Why?」よりも柔らかく、驚きや好奇心のニュアンスが加わる。後の語順は疑問文でなく平叙文（S + V）になることに注意。「How come you're so late?」が正しい語順。",
    badExample: "Why are you so late?",
    goodExample: "How come you're so late? Everything okay?",
    goodExampleJa: "どうしてそんなに遅いの？大丈夫？",
    context: "カジュアルな会話で理由や経緯を穏やかに聞きたいとき",
    why_hard_for_japanese:
      "「Why」で代替しがち。後の語順が S+V になる（疑問文倒置なし）という独特の構造も難しい。",
  },
  {
    id: "b1-05",
    expression: "Sounds like a plan!",
    type: "idiom",
    level: "B1",
    meaning_ja: "いいですね！ / それで行きましょう！",
    coreImage: "「計画（plan）のように聞こえる」→ 具体性があって決まり！",
    nuance:
      "単なる「いいね」ではなく、具体的な提案に対して「よし、それで決まり！」と乗り気になるニュアンス。ビジネスでも友人間でも使える汎用性の高いフレーズ。",
    badExample: "That's a good idea.",
    goodExample: "Sounds like a plan! See you at 7 then.",
    goodExampleJa: "それで決まりね！じゃあ7時に。",
    context: "待ち合わせ・プロジェクトの進め方・週末の予定などを決めたとき",
    why_hard_for_japanese:
      "「Great!」「Good!」で止まってしまう。具体的な提案への反応としてこのフレーズを使うと会話が一段とネイティブらしくなる。",
  },
  {
    id: "b1-06",
    expression: "Make sense",
    type: "collocation",
    level: "B1",
    meaning_ja: "腑に落ちる・意味が通る・論理的に筋が通る",
    coreImage: "物事（it）が感覚（sense）を作り出す（make）",
    nuance:
      "「I understand.」は「私が理解した」という主観。「That makes sense.」は「その話・ロジックが客観的に正しい」というニュアンス。相手の説明を受けて使うと「なるほど、筋が通っている」という反応になる。",
    badExample: "I understand.",
    goodExample: "That makes sense. I hadn't thought of it that way.",
    goodExampleJa: "なるほど、確かにそうですね。そう考えたことはなかったです。",
    context: "説明を聞いて納得したとき・ロジックを確認するとき",
    why_hard_for_japanese:
      "「understand」で表現してしまい、「makes sense」を使う機会を逃しがち。",
  },
  {
    id: "b1-07",
    expression: "Hold on",
    type: "phrasal_verb",
    level: "B1",
    meaning_ja: "ちょっと待って（一時停止）",
    coreImage: "今の状態を保持（hold）し続ける（on）",
    nuance:
      "「Wait a minute」より自然でカジュアル。電話・作業・会話を一時止めるときに使う。「Hold on a second.」「Hold on, let me check.」のように状況を添えると自然。",
    badExample: "Wait a minute.",
    goodExample: "Hold on, let me check the schedule real quick.",
    goodExampleJa: "ちょっと待って、スケジュールをすぐ確認するね。",
    context: "電話・会議・作業中に少し待ってもらいたいとき",
    why_hard_for_japanese:
      "「Wait」は知っているが、口語では「Hold on」の方がはるかに多用される。",
  },
  {
    id: "b1-08",
    expression: "Pick up",
    type: "phrasal_verb",
    level: "B1",
    meaning_ja: "拾う・（ついでに）買う・（語学などを）自然に覚える",
    coreImage: "下から上へ（up）引き取る（pick）",
    nuance:
      "「買う」は buy より「ついでに立ち寄って手に入れる」ニュアンス。「覚える」は勉強するのではなく、環境に浸かって自然に身につくニュアンス。文脈で3つの意味を使い分ける。",
    badExample: "I bought some milk on my way home.",
    goodExample:
      "I picked up some milk on my way home. / I picked up some Spanish in Mexico.",
    goodExampleJa:
      "帰り道に牛乳を買ってきた。/ メキシコに住んでスペイン語を自然に覚えた。",
    context: "買い物・語学習得・子供の送迎などさまざまな場面",
    why_hard_for_japanese:
      "「buy」「learn」で表現してしまい、「pick up」独特の「ついでに」「自然に」のニュアンスが失われる。",
  },
  {
    id: "b1-09",
    expression: "Turn out",
    type: "phrasal_verb",
    level: "B1",
    meaning_ja: "（結局）〜だとわかる・〜という結果になる",
    coreImage: "中から外（out）へと向きが変わる（turn）→ 結果が現れる",
    nuance:
      "予想や期待と異なる結果が明らかになるときに使う。「It turned out to be...」「It turned out that...」の2パターンが基本。「finally」より結果の意外性を強調できる。",
    badExample: "Finally it was a great success.",
    goodExample: "It turned out to be a great success despite all the problems.",
    goodExampleJa: "数々の問題にもかかわらず、結果的に大成功だった。",
    context: "後日談・予想外の結果を伝えるとき",
    why_hard_for_japanese:
      "「finally」や「in the end」で代替しがちだが、「turn out」は「後になって明らかになった」という発見のニュアンスを含む。",
  },
  {
    id: "b1-10",
    expression: "Go over",
    type: "phrasal_verb",
    level: "B1",
    meaning_ja: "詳しく見直す・確認する・復習する",
    coreImage: "全体を上から（over）なぞっていく（go）",
    nuance:
      "「check」より丁寧で詳細。ざっと確認するのではなく、内容をひとつひとつ丁寧に確認するニュアンス。会議・書類・計画のレビューに最適。",
    badExample: "Let's check the details again.",
    goodExample: "Let's go over the details one more time before we submit.",
    goodExampleJa: "提出前にもう一度詳細を確認しましょう。",
    context: "会議・プレゼン前のリハーサル・書類の最終確認",
    why_hard_for_japanese:
      "「check」や「review」は知っているが、「go over」のより丁寧でインフォーマルなバランスが絶妙。",
  },

  // ── B2 ──────────────────────────────────────────────────────────────────
  {
    id: "b2-01",
    expression: "Bring up",
    type: "phrasal_verb",
    level: "B2",
    meaning_ja: "（話題・問題を）持ち出す・提起する",
    coreImage: "下にあるものを上（up）へと引き上げて（bring）表に出す",
    nuance:
      "「I'm glad you brought that up.」は「その話題を出してくれてよかった」という定番フレーズ。会議・議論で特定のトピックを意図的に持ち出すときに使う。「mention」より「あえて表に出す」意図が強い。",
    goodExample: "I'm glad you brought that up. It's an important point we need to address.",
    goodExampleJa: "それを持ち出してくれてよかった。対処すべき重要なポイントだ。",
    context: "会議・ディスカッション・会話で特定の話題を意図的に導入するとき",
    why_hard_for_japanese:
      "「mention」「talk about」で代替しがちだが、「bring up」は「あえて表に出す」意図のニュアンスが強い。",
  },
  {
    id: "b2-02",
    expression: "Come up with",
    type: "phrasal_verb",
    level: "B2",
    meaning_ja: "思いつく・考案する・（解決策を）ひねり出す",
    coreImage: "（アイデアが）下から上（up）へと出てくる（come）",
    nuance:
      "単なる「think of」より、頭を使って絞り出した感のある努力のニュアンスが含まれる。「Come up with a plan / solution / idea / excuse」のコロケーションが定番。",
    goodExample: "We need to come up with a better solution by Friday.",
    goodExampleJa: "金曜日までにより良い解決策を考え出す必要がある。",
    context: "ブレインストーミング・問題解決・企画立案",
    why_hard_for_japanese:
      "「think」「create」で表現しがちだが、「come up with」は努力の末に何かが浮かび上がってくるニュアンス。",
  },
  {
    id: "b2-03",
    expression: "Fill out / Fill in",
    type: "phrasal_verb",
    level: "B2",
    meaning_ja: "（書類・フォームに）記入する",
    coreImage: "空欄を内側から（in）または全体を（out）埋める（fill）",
    nuance:
      "「fill out」は書類・フォームの全体を記入するとき。「fill in」は一部の空欄・ブランクに記入するとき。「fill in for someone」は「誰かの代わりをする」という別の意味にもなる。",
    badExample: "Write this form.",
    goodExample:
      "Please fill out this form and return it by Monday. / Fill in your name and date.",
    goodExampleJa:
      "このフォームに記入して月曜日までに返してください。/ お名前と日付を記入してください。",
    context: "書類・申請書・アンケートへの記入",
    why_hard_for_japanese:
      "「write」を使ってしまいがち。out と in の使い分けも曖昧なまま使っている人が多い。",
  },
  {
    id: "b2-04",
    expression: "Call it a day",
    type: "idiom",
    level: "B2",
    meaning_ja: "今日はここまでにしよう・（作業を）切り上げる",
    coreImage: "今日（a day）の仕事に名前をつけて（call it）終わりにする",
    nuance:
      "仕事・会議・活動を区切りよく終了するときに使う。「Let's wrap up」より少しくだけた表現。「I think I'll call it a day.」と自分で使うことも多い。",
    badExample: "Let's stop working now.",
    goodExample: "It's already 7 PM. Let's call it a day.",
    goodExampleJa: "もう7時か。今日はここまでにしましょう。",
    context: "仕事・会議・活動を終わらせるとき",
    why_hard_for_japanese:
      "このイディオムを知らないと「stop」「finish」で終わってしまいがち。知っていると会話が自然に締まる。",
  },
  {
    id: "b2-05",
    expression: "Keep an eye on",
    type: "idiom",
    level: "B2",
    meaning_ja: "〜を見守る・注意して見ておく",
    coreImage: "目（eye）をそこに置き続ける（keep on）→ 継続的な監視",
    nuance:
      "子供・荷物・状況など、継続的に確認するニュアンス。「watch」より丁寧で、単に見るのではなく「気にかけている」ニュアンスがある。",
    goodExample: "Could you keep an eye on my bag while I go to the restroom?",
    goodExampleJa: "お手洗いに行く間、荷物を見ていてもらえますか？",
    context: "お願い・子供の監督・状況のモニタリング",
    why_hard_for_japanese:
      "「watch」で代替しがちだが、「keep an eye on」は継続的な注意と気遣いのニュアンスがある。",
  },
  {
    id: "b2-06",
    expression: "Get a hold of",
    type: "phrasal_verb",
    level: "B2",
    meaning_ja: "〜に連絡をつける・（物を）手に入れる",
    coreImage: "何かを掴む（hold）状態になる（get）",
    nuance:
      "主に「連絡がつく・つかない」の文脈で使われる。「I can't get a hold of him.」（彼に連絡が取れない）は日常的に使われるフレーズ。",
    goodExample: "It's been really hard to get a hold of him lately.",
    goodExampleJa: "最近、彼に連絡を取るのがとても難しい。",
    context: "連絡・問い合わせ・情報や物を手に入れようとするとき",
    why_hard_for_japanese:
      "「contact」を使いがちだが、「get a hold of」はより口語的で自然。",
  },
  {
    id: "b2-07",
    expression: "Under the weather",
    type: "idiom",
    level: "B2",
    meaning_ja: "体調がすぐれない・少し気分が悪い",
    coreImage: "天気（weather）の下で（under）→ 悪天候に体が左右される状態",
    nuance:
      "重病ではなく「ちょっと体調が悪い」程度のニュアンス。「I'm sick」より柔らかく、オフィスや丁寧な会話で使いやすい。",
    badExample: "I'm a bit sick today.",
    goodExample: "I'm feeling a bit under the weather today. I might leave early.",
    goodExampleJa: "今日は少し体調が優れなくて、早めに帰るかもしれません。",
    context: "仕事・会話で体調不良を伝えるとき",
    why_hard_for_japanese:
      "「sick」や「not feeling well」は使えるが、このイディオムを使うと一気にネイティブらしくなる。",
  },
  {
    id: "b2-08",
    expression: "Rule out",
    type: "phrasal_verb",
    level: "B2",
    meaning_ja: "〜を除外する・可能性を排除する",
    coreImage: "ルール（rule）から外す（out）→ 候補から消す",
    nuance:
      "ビジネス・議論・医療診断など幅広い場面で使われる。「We can't rule out the possibility that...」という構造がよく使われ、慎重な姿勢を示す。",
    goodExample: "We can't rule out the possibility of further delays.",
    goodExampleJa: "さらなる遅延の可能性を排除することはできません。",
    context: "ビジネス・議論・分析・医療診断で可能性を議論するとき",
    why_hard_for_japanese:
      "「exclude」「eliminate」で代替しがちだが、「rule out」はより口語的で幅広く使える。",
  },
  {
    id: "b2-09",
    expression: "On the same page",
    type: "idiom",
    level: "B2",
    meaning_ja: "（認識・理解が）一致している・足並みが揃っている",
    coreImage: "全員が同じページ（page）を読んでいる→ 同じ情報を共有",
    nuance:
      "会議・チームワーク・プロジェクト開始時に「みんな同じ認識？」と確認するための定番フレーズ。「Let's make sure we're all on the same page.」",
    goodExample: "Before we start, I want to make sure we're all on the same page.",
    goodExampleJa: "始める前に、全員が同じ認識でいることを確認したい。",
    context: "会議・プロジェクト開始・チームミーティング",
    why_hard_for_japanese:
      "直訳すると意味が通じないため、このイディオムを知っていると大きな強みになる。",
  },
  {
    id: "b2-10",
    expression: "Take advantage of",
    type: "collocation",
    level: "B2",
    meaning_ja: "〜を（最大限に）活用する・利用する",
    coreImage: "有利な点（advantage）を取り（take）使う",
    nuance:
      "良い意味（機会・特典を活用する）と悪い意味（人を利用する）の両方がある。ビジネスでは「機会を最大限活かす」の意味で頻出。",
    goodExample: "You should take advantage of this opportunity to expand your network.",
    goodExampleJa: "この機会を最大限に活かして人脈を広げるべきです。",
    context: "チャンス・特典・制度・割引などを活用するとき",
    why_hard_for_japanese:
      "「use」「utilize」より自然でネイティブらしい。「悪用する」の意味もあるため文脈を読む必要がある点も重要。",
  },

  // ── C1 ──────────────────────────────────────────────────────────────────
  {
    id: "c1-01",
    expression: "In hindsight",
    type: "idiom",
    level: "C1",
    meaning_ja: "後から思えば・振り返ってみると",
    coreImage: "後ろ（hind）を見る視点（sight）= 過去を振り返っての判断",
    nuance:
      "過去の決断や出来事を現在の知識で評価するときに使う。「後から考えれば明らかだったが当時はわからなかった」という後悔・反省・洞察のニュアンスを含む。",
    goodExample: "In hindsight, I should have started preparing much earlier.",
    goodExampleJa: "後から思えば、もっと早く準備を始めるべきだった。",
    context: "振り返り・反省・過去の判断を評価するとき",
    why_hard_for_japanese:
      "「looking back」は使えるが、「in hindsight」の方がより知的で洗練された印象を与える。",
  },
  {
    id: "c1-02",
    expression: "Keep someone in the loop",
    type: "idiom",
    level: "C1",
    meaning_ja: "（進捗・情報を）継続的に共有し続ける",
    coreImage: "情報の輪（loop）の中にい続けさせる（keep in）",
    nuance:
      "プロジェクトや状況の最新情報を継続的に伝える・伝えてもらうよう依頼するとき。「Please keep me in the loop.」（随時情報をシェアしてください）は仕事の場で非常によく使われる。",
    goodExample: "Please keep me in the loop on any changes to the timeline.",
    goodExampleJa: "スケジュールに変更があれば随時教えてください。",
    context: "プロジェクト管理・チームコミュニケーション",
    why_hard_for_japanese:
      "「update me」は知っていても「keep in the loop」を使いこなせる人は少ない。ビジネス英語での頻出表現。",
  },
  {
    id: "c1-03",
    expression: "Bear in mind",
    type: "collocation",
    level: "C1",
    meaning_ja: "〜を念頭に置く・忘れずにいる",
    coreImage: "心（mind）の中で担ぎ続ける（bear）",
    nuance:
      "「remember」より公式で、重要事項・前提条件・注意点を相手に意識し続けてもらうよう促す丁寧なフレーズ。「Please bear in mind that...」はビジネスメール・プレゼンで頻出。",
    goodExample: "Bear in mind that the deadline is non-negotiable.",
    goodExampleJa: "締め切りは絶対であることを念頭に置いてください。",
    context: "会議・メール・プレゼンで重要な前提や注意事項を伝えるとき",
    why_hard_for_japanese:
      "「remember」で代替しがちだが、「bear in mind」の方が格式があり、重要性を強調するニュアンスがある。",
  },
  {
    id: "c1-04",
    expression: "Read between the lines",
    type: "idiom",
    level: "C1",
    meaning_ja: "行間を読む・言外の意味を汲み取る",
    coreImage: "書かれた行（lines）の間（between）を読む（read）",
    nuance:
      "明示されていない意図・感情・メッセージを察するときに使う。「If you read between the lines...」は「言葉の裏には...」という文脈でよく登場する。",
    goodExample:
      "If you read between the lines, it's clear he's not happy with the proposal.",
    goodExampleJa: "行間を読めば、彼がその提案に満足していないことは明らかだ。",
    context: "コミュニケーション・外交・人間関係の分析",
    why_hard_for_japanese:
      "日本語にも全く同じ表現があるが、英語でスッと出てくる人は少ない。",
  },
  {
    id: "c1-05",
    expression: "Off the top of my head",
    type: "idiom",
    level: "C1",
    meaning_ja: "今すぐパッと思いつく限りでは・即席で言えば",
    coreImage: "頭（head）の一番上（top）から即座に取り出す",
    nuance:
      "メモや資料を確認せず、その場で即座に思ったことを言うときのフレーズ。「正確ではないかもしれないが」という留保も含む。「Off the top of my head, I'd say...」が典型的。",
    goodExample:
      "Off the top of my head, I can think of at least three ways to solve this.",
    goodExampleJa: "パッと思いつく限り、少なくとも3つの解決策が浮かびます。",
    context: "即座に意見を述べるとき・正確な答えを留保しながら答えるとき",
    why_hard_for_japanese:
      "即答を求められたとき「I'm not sure but...」で代替しがちだが、このフレーズを使うとよりネイティブらしい。",
  },
  {
    id: "c1-06",
    expression: "At the end of the day",
    type: "idiom",
    level: "C1",
    meaning_ja: "結局のところ・最終的には・突き詰めれば",
    coreImage: "一日（day）の終わり（end）に残るもの→ 本質・真実",
    nuance:
      "表面上の議論が終わって、最終的に重要なことを言うときの導入フレーズ。「ultimately」より口語的で、ビジネスでもプライベートでも幅広く使われる。",
    goodExample:
      "At the end of the day, it comes down to whether we can trust each other.",
    goodExampleJa: "結局のところ、お互いを信頼できるかどうかに帰結する。",
    context: "議論の締め・本質的な点を強調するとき",
    why_hard_for_japanese:
      "「finally」「ultimately」で代替しがちだが、このフレーズのニュアンス（本質に立ち返る）が独特。",
  },
  {
    id: "c1-07",
    expression: "Play it by ear",
    type: "idiom",
    level: "C1",
    meaning_ja: "臨機応変にやる・その場の流れで決める",
    coreImage: "楽譜なしに耳（ear）だけで演奏する→ 即興で対応する",
    nuance:
      "固定した計画を持たず、状況の変化に応じて対応することを指す。「Let's just play it by ear.」は「計画は立てず、その場で決めよう」というカジュアルな提案。",
    goodExample: "We don't have a fixed itinerary. We'll just play it by ear.",
    goodExampleJa: "決まった旅程はないので、その場その場で決めていくつもりです。",
    context: "旅行・計画が未定の状況・柔軟な対応を求めるとき",
    why_hard_for_japanese:
      "「improvise」や「decide on the spot」は言えても、この慣用表現がパッと出てくる人は少ない。",
  },
  {
    id: "c1-08",
    expression: "Have a vested interest",
    type: "collocation",
    level: "C1",
    meaning_ja: "既得権益がある・個人的な利害関係を持つ",
    coreImage: "既に既成事実となった（vested）利益（interest）を持つ",
    nuance:
      "あるシステムや状況が続くことで利益を得る立場にあることを指す。政治・ビジネス・法律などフォーマルな文脈でよく使われる。「They have a vested interest in...」が定番。",
    goodExample:
      "Many companies have a vested interest in keeping the current regulations in place.",
    goodExampleJa: "多くの企業が現行の規制を維持することに既得権益を持っている。",
    context: "政治・ビジネス・法律・議論でバイアスや利害関係を指摘するとき",
    why_hard_for_japanese:
      "直訳の「既得権益」は知っていても、英語でどう言うか即座に出てこない人が多い表現。",
  },
  {
    id: "c1-09",
    expression: "Mitigating factor",
    type: "collocation",
    level: "C1",
    meaning_ja: "（罪・問題などを）軽減する要因・酌量すべき事情",
    coreImage: "軽くする（mitigate）要因（factor）",
    nuance:
      "法律・医療・ビジネスの文脈で使われる。「mitigate」単体も「〜を緩和・軽減する」として使えると幅が広がる。「There are several mitigating factors to consider.」が定番。",
    goodExample:
      "The court considered several mitigating factors before delivering the verdict.",
    goodExampleJa: "裁判所は判決を下す前に、いくつかの情状酌量の余地を考慮した。",
    context: "法律・医療・交渉・評価の場面",
    why_hard_for_japanese:
      "「mitigate」という動詞を単独では知っていても、「mitigating factor」という固まりで使える人は少ない。",
  },
  {
    id: "c1-10",
    expression: "Integrate seamlessly",
    type: "collocation",
    level: "C1",
    meaning_ja: "シームレスに統合する・継ぎ目なく融合する",
    coreImage: "縫い目（seam）なし（less）で→ 切れ目が見えないほど滑らか",
    nuance:
      "システム統合・UX・組織の移行など「切れ目なく自然に繋がる」状態を表す。テクノロジー・ビジネスの文脈で特に頻出。「smoothly」より洗練されたニュアンス。",
    goodExample:
      "The two platforms integrate seamlessly, so users barely notice the difference.",
    goodExampleJa:
      "2つのプラットフォームはシームレスに統合されており、ユーザーはほとんど違いを感じない。",
    context: "システム統合・UX・業務移行・プレゼンテーション",
    why_hard_for_japanese:
      "「smoothly」や「without problems」で代替しがちだが、「seamlessly」のほうがテック・ビジネス文脈では洗練されている。",
  },

  // ── C2 ──────────────────────────────────────────────────────────────────
  {
    id: "c2-01",
    expression: "Caveat",
    type: "collocation",
    level: "C2",
    meaning_ja: "但し書き・注意事項・重要な留保条件",
    coreImage: "「ただし〜に注意せよ」というラテン語由来の警告",
    nuance:
      "「with the caveat that...」（〜という但し書き付きで）という形が定番。法律・学術・ビジネスのフォーマルな文脈でよく使われる。単に「but」や「however」と言う代わりに使うと洗練された印象を与える。",
    goodExample: "I agree with the proposal, with the caveat that we need to review the budget first.",
    goodExampleJa: "提案には同意しますが、まず予算の見直しが必要という但し書き付きです。",
    context: "条件付き同意・法律文書・フォーマルな議論",
    why_hard_for_japanese:
      "「but」「however」で代替できるが、「caveat」を使いこなせると文章の精度と知的な印象が格段に上がる。",
  },
  {
    id: "c2-02",
    expression: "The elephant in the room",
    type: "idiom",
    level: "C2",
    meaning_ja: "誰もが気づいているのに誰も言い出さない問題",
    coreImage: "部屋（room）にいる象（elephant）→ 明らかなのに無視されている",
    nuance:
      "その場の全員が認識しているが、話しにくい・言いにくい理由で誰も触れない問題を指す。「Let's address the elephant in the room.」（みんなが避けてきた問題に触れましょう）が定番の使い方。",
    goodExample: "Let's address the elephant in the room — sales have been declining for three quarters.",
    goodExampleJa: "みんなが避けてきた問題に触れましょう。売上は3四半期連続で落ちています。",
    context: "会議・議論で誰も触れたくない問題を提起するとき",
    why_hard_for_japanese:
      "このイディオムを知っていると、重い話題を切り出す際に「私が言う」という責任感と勇気を示せる。",
  },
  {
    id: "c2-03",
    expression: "Play devil's advocate",
    type: "idiom",
    level: "C2",
    meaning_ja: "あえて反対意見を述べる・批判的な立場を取る",
    coreImage: "悪魔（devil）の弁護人（advocate）→ 本音ではないが反論側に立つ",
    nuance:
      "自分が本当にそう思っているわけではなく、議論を活性化させたり問題点を洗い出すために意図的に反対の立場を取ること。「Let me play devil's advocate here.」と前置きして使う。",
    goodExample: "Let me play devil's advocate — what if the expansion plan actually hurts our core business?",
    goodExampleJa: "あえて反論しますが、拡大計画がコアビジネスを損なう可能性はどうでしょう？",
    context: "会議・ブレインストーミング・議論を深めたいとき",
    why_hard_for_japanese:
      "日本語に直訳できる簡単な表現がなく、存在自体を知らない人が多い。使いこなせると議論の質が上がる。",
  },
  {
    id: "c2-04",
    expression: "Unpack",
    type: "collocation",
    level: "C2",
    meaning_ja: "（概念・問題を）丁寧に分解して説明する",
    coreImage: "荷物を開けて（unpack）中身を取り出す → 複雑な概念を要素に分解する",
    nuance:
      "学術・ビジネス・ジャーナリズムで「複雑なトピックを構成要素に分けて詳しく説明する」意味で急増している表現。「Let me unpack that.」「We need to unpack this issue.」が定番。",
    goodExample: "Let me unpack what I mean by 'sustainable growth' in this context.",
    goodExampleJa: "ここで言う「持続可能な成長」が何を意味するか、丁寧に説明させてください。",
    context: "プレゼン・学術討論・複雑なトピックの解説",
    why_hard_for_japanese:
      "「explain」や「break down」で代替できるが、「unpack」は知的な語感を持ち、現代の英語話者に好まれる表現。",
  },
  {
    id: "c2-05",
    expression: "Double down on",
    type: "phrasal_verb",
    level: "C2",
    meaning_ja: "さらに強化する・（失敗でも）賭けを倍にする・強気に押し通す",
    coreImage: "賭け金を2倍（double）に下げる（down）→ リスクを承知でより深みに入る",
    nuance:
      "ブラックジャック用語から転じた表現。「批判を受けても自分の立場をさらに強く押し通す」意味で政治・ビジネス文脈でよく使われる。良い意味（強化する）と批判的な意味（意固地になる）の両方で使われる。",
    goodExample: "Despite the backlash, the company decided to double down on its remote-work policy.",
    goodExampleJa: "批判を受けながらも、同社はリモートワーク方針をさらに強化することを決定した。",
    context: "政治・ビジネス戦略・リスクを取る意思決定の議論",
    why_hard_for_japanese:
      "ニュースや政治文脈で非常によく出てくる表現だが、コアイメージを知らないと文脈で意味が取れない。",
  },
  {
    id: "c2-06",
    expression: "By the same token",
    type: "idiom",
    level: "C2",
    meaning_ja: "同様に・それと同じ理由で・同じ論理でいえば",
    coreImage: "同じ証拠・根拠（token）によって → 同じ論理が別のことにも当てはまる",
    nuance:
      "前述の論理・根拠を別のことにも適用するときに使う接続フレーズ。「similarly」「likewise」より論理的な繋がりを強調する。議論・エッセイ・フォーマルな会話で使いこなせると知的な印象を与える。",
    goodExample: "We value efficiency; by the same token, we must not sacrifice quality.",
    goodExampleJa: "私たちは効率性を重んじる。同じ論理でいえば、品質を犠牲にしてはならない。",
    context: "論理的な議論・エッセイ・フォーマルなプレゼン",
    why_hard_for_japanese:
      "「similarly」で代替できるが、「by the same token」はより論理的なつながりを示し、議論を一段引き締める効果がある。",
  },
  {
    id: "c2-07",
    expression: "Counterintuitive",
    type: "collocation",
    level: "C2",
    meaning_ja: "直感に反する・逆説的に感じられる",
    coreImage: "直感（intuitive）に対抗する（counter）→ 常識と逆のように見える",
    nuance:
      "一見おかしく見えるが実は正しい、という状況を描写する。「It may seem counterintuitive, but...」という形で逆説的な洞察を導入するときに有効。科学・経済・心理学の議論で頻出。",
    goodExample: "It may seem counterintuitive, but working fewer hours can actually increase productivity.",
    goodExampleJa: "直感に反するように聞こえるかもしれないが、働く時間を減らすことで生産性が上がることがある。",
    context: "逆説的な洞察を提示するとき・反直感的なデータを紹介するとき",
    why_hard_for_japanese:
      "「paradoxical」も似た意味だが、「counterintuitive」はより口語的で、日常の議論でも使いやすい。",
  },
  {
    id: "c2-08",
    expression: "Nuance / Nuanced",
    type: "collocation",
    level: "C2",
    meaning_ja: "ニュアンス / 細かい違いを含んだ・複雑な側面を持つ",
    coreImage: "色の微妙な違い（フランス語 nuer）→ 表面では見えない複雑さ",
    nuance:
      "単純化できない複雑さ・繊細な違いを指す。「a nuanced view」（細かな視点）、「the nuances of the language」（言語のニュアンス）のように使う。「It's more nuanced than that.」（そんなに単純ではない）は議論でよく使われる。",
    goodExample: "His argument is more nuanced than it first appears.",
    goodExampleJa: "彼の主張は、一見するよりもずっと複雑で繊細だ。",
    context: "複雑なトピックを議論するとき・単純化への反論",
    why_hard_for_japanese:
      "日本語の「ニュアンス」はカタカナ語として定着しているが、英語で名詞・形容詞として使いこなせる人は意外と少ない。",
  },
  {
    id: "c2-09",
    expression: "Pushback",
    type: "collocation",
    level: "C2",
    meaning_ja: "反発・抵抗・反論（名詞）",
    coreImage: "押し返す（push back）力 → 提案や変化に対する組織的な抵抗",
    nuance:
      "特定の政策・決定・提案に対する集団的な抵抗を指す。「receive/get pushback」（反発を受ける）「face pushback」（抵抗に直面する）が定番。ビジネス・政治文脈で頻出。",
    goodExample: "The new policy received significant pushback from the team.",
    goodExampleJa: "新しい方針はチームから大きな反発を受けた。",
    context: "組織変更・政策立案・意思決定の議論",
    why_hard_for_japanese:
      "「opposition」「resistance」で言えるが、「pushback」の方がよりカジュアルで現代的。ビジネス英語ではほぼ必須の語彙。",
  },
  {
    id: "c2-10",
    expression: "Beg the question",
    type: "idiom",
    level: "C2",
    meaning_ja: "（論点を）提起する・（本来は）循環論法を使う",
    coreImage: "問いを（question）懇願する（beg）→ 証明すべき命題を前提にしてしまう論理的誤り",
    nuance:
      "本来は「証明すべきことを前提として使う循環論法」を指す論理学用語。しかし現代英語では「〜という疑問を自然に生じさせる」の意味でもよく使われる（本来の意味からの転用）。両方の用法を知っておくと議論の理解が深まる。",
    goodExample: "This result begs the question: are we measuring the right things?",
    goodExampleJa: "この結果は自然と問いを生む。私たちは正しいものを測定しているのだろうか？",
    context: "フォーマルな議論・哲学的議論・批判的思考が求められる場面",
    why_hard_for_japanese:
      "日本語に直訳しにくく、論理学の用語でもあるため正確な意味を知っている人が少ない。知っておくと議論の次元が一段上がる。",
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────

type Level = "all" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const LEVEL_CONFIG = {
  A1: {
    label: "A1 入門",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-300",
    activeBg: "bg-slate-600",
    toeic: "〜225",
    toefl: null,
  },
  A2: {
    label: "A2 初級",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    activeBg: "bg-sky-600",
    toeic: "225〜549",
    toefl: null,
  },
  B1: {
    label: "B1 中級",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
    toeic: "550〜780",
    toefl: "42〜71",
  },
  B2: {
    label: "B2 中上級",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
    toeic: "785〜940",
    toefl: "72〜94",
  },
  C1: {
    label: "C1 上級",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    activeBg: "bg-violet-600",
    toeic: "945〜990",
    toefl: "95〜120",
  },
  C2: {
    label: "C2 熟達",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    activeBg: "bg-rose-600",
    toeic: null,
    toefl: null,
  },
} as const;

const TYPE_LABELS: Record<ExpressionType, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法パターン",
};

// ─── ExpressionCard ───────────────────────────────────────────────────────────

function ExpressionCard({
  entry,
  isSavedInitially,
}: {
  entry: LibraryEntry;
  isSavedInitially: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(isSavedInitially);
  const [flash, setFlash] = useState<"saved" | "dup" | "limit" | null>(null);

  const cfg = LEVEL_CONFIG[entry.level];

  const handleSave = () => {
    if (saved) return;
    const result = savePhrase({
      expression: entry.expression,
      type: entry.type,
      cefr_level: entry.level,
      meaning_ja: entry.meaning_ja,
      nuance: entry.nuance,
      example: entry.goodExample,
      example_translation: entry.goodExampleJa,
      context: entry.context,
      why_hard_for_japanese: entry.why_hard_for_japanese,
    });
    if (result.success) {
      setSaved(true);
      setFlash("saved");
      setTimeout(() => setFlash(null), 2000);
    } else {
      setFlash(result.reason === "duplicate" ? "dup" : "limit");
      setTimeout(() => setFlash(null), 2500);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        open ? "border-indigo-200 shadow-[0_4px_20px_rgba(99,102,241,0.10)]" : "border-slate-200"
      )}
    >
      {/* ── Top ── */}
      <div className="p-5 pb-4">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
              cfg.bg,
              cfg.color,
              cfg.border
            )}
          >
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200">
            {TYPE_LABELS[entry.type]}
          </span>
        </div>

        {/* Expression */}
        <h3 className="text-xl font-extrabold text-slate-900 mb-1 tracking-tight">
          {entry.expression}
        </h3>
        <p className="text-sm text-slate-500 mb-4">{entry.meaning_ja}</p>

        {/* Core image */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
          <Lightbulb className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-700 font-medium leading-relaxed">
            <span className="font-bold text-indigo-500 font-mono mr-1">CORE</span>
            {entry.coreImage}
          </p>
        </div>

        {/* Examples */}
        <div className="space-y-1.5 text-sm">
          {entry.badExample && (
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <span className="text-slate-400 line-through">{entry.badExample}</span>
            </div>
          )}
          {entry.warnExample && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-slate-500">{entry.warnExample}</span>
              </div>
              {entry.warnNote && (
                <p className="text-[11px] text-amber-600 ml-6">{entry.warnNote}</p>
              )}
            </div>
          )}
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-800 font-medium">{entry.goodExample}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{entry.goodExampleJa}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Accordion ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors rounded-b-none"
      >
        <span>{open ? "閉じる" : "詳しいニュアンスを見る"}</span>
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="px-5 py-4 border-t border-slate-100 space-y-3 text-sm bg-white rounded-b-2xl">
          <div>
            <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-1">
              Nuance
            </p>
            <p className="text-slate-600 leading-relaxed">{entry.nuance}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
              使用シーン
            </p>
            <p className="text-slate-600 leading-relaxed">{entry.context}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
              なぜ日本人に難しいか
            </p>
            <p className="text-slate-600 leading-relaxed">{entry.why_hard_for_japanese}</p>
          </div>
        </div>
      )}

      {/* ── Save Button ── */}
      <div className="px-5 py-4 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={saved}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all",
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default"
              : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm"
          )}
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              単語帳に保存済み
            </>
          ) : (
            <>
              <BookmarkPlus className="h-3.5 w-3.5" />
              単語帳に保存
              {flash === "limit" && (
                <span className="ml-auto text-[10px] text-rose-400 font-semibold">
                  上限に達しました
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Gatekeeping limits ──────────────────────────────────────────────────────

const GUEST_LIMIT = 3;
const FREE_LIMIT  = 10;

// ─── Waitlist CTA (for free users) ───────────────────────────────────────────

function WaitlistCTA() {
  const { isSignedIn } = useAuth();
  const [status, setStatus]   = useState<"idle" | "loading" | "done">("idle");
  const [email, setEmail]     = useState("");
  const [errMsg, setErrMsg]   = useState<string | null>(null);

  const onSuccess = () => setStatus("done");

  const handleLoggedIn = async () => {
    setStatus("loading");
    const res = await registerWaitlistLoggedInAction();
    if (res.ok) { onSuccess(); } else { setErrMsg(res.error ?? "エラーが発生しました"); setStatus("idle"); }
  };

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await registerWaitlistGuestAction(email);
    if (res.ok) { onSuccess(); } else { setErrMsg(res.error ?? "エラーが発生しました"); setStatus("idle"); }
  };

  if (status === "done") {
    return (
      <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
        <Check className="w-4 h-4" /> 登録しました！リリース時にお知らせします
      </p>
    );
  }

  if (isSignedIn) {
    return (
      <button
        onClick={handleLoggedIn}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Proプランの優先案内を受け取る
      </button>
    );
  }

  return (
    <form onSubmit={handleGuest} className="flex gap-2 w-full max-w-sm">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "登録"}
      </button>
      {errMsg && <p className="text-xs text-rose-500 mt-1">{errMsg}</p>}
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  // Pro 判定（現時点では未実装 → false）
  const isPro = false;

  // 表示上限
  const visibleLimit = !isSignedIn ? GUEST_LIMIT : isPro ? Infinity : FREE_LIMIT;

  // ── State ──────────────────────────────────────────────────────────────────
  type CefrKey = Exclude<Level, "all">;
  const [selectedLevels, setSelectedLevels] = useState<Set<CefrKey>>(new Set());
  const [searchQuery,    setSearchQuery]    = useState("");
  const [shuffleKey,     setShuffleKey]     = useState(0);
  const [savedExpressions, setSavedExpressions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { defaultLevel } = getSettings();
    setSelectedLevels(new Set([defaultLevel as CefrKey]));
    const vocab = getVocabulary();
    setSavedExpressions(new Set(vocab.map((v) => v.expression.toLowerCase())));
  }, []);

  // ── Toggle level chip ──────────────────────────────────────────────────────
  const toggleLevel = (lv: CefrKey) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lv)) { next.delete(lv); } else { next.add(lv); }
      return next;
    });
  };

  // ── Filter → search → shuffle ─────────────────────────────────────────────
  const levelFiltered = useMemo(
    () => selectedLevels.size === 0
      ? LIBRARY
      : LIBRARY.filter((e) => selectedLevels.has(e.level as CefrKey)),
    [selectedLevels]
  );

  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return levelFiltered;
    return levelFiltered.filter(
      (e) =>
        e.expression.toLowerCase().includes(q) ||
        e.meaning_ja.includes(q)
    );
  }, [levelFiltered, searchQuery]);

  const displayList = useMemo(() => {
    if (shuffleKey === 0) return searched;
    const arr = [...searched];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [searched, shuffleKey]);

  const countByLevel = (lv: CefrKey) => LIBRARY.filter((e) => e.level === lv).length;

  // ── Score detail for selected single level ────────────────────────────────
  const scoreDetailLevel =
    selectedLevels.size === 1 ? [...selectedLevels][0] : null;

  // ── Gatekeeping split ──────────────────────────────────────────────────────
  const visibleCards = isLoaded ? displayList.slice(0, visibleLimit) : displayList.slice(0, FREE_LIMIT);
  const hiddenCount  = Math.max(0, displayList.length - visibleCards.length);
  const showGuestGate = isLoaded && !isSignedIn && hiddenCount > 0;
  const showFreeGate  = isLoaded && isSignedIn && !isPro && hiddenCount > 0;

  return (
    <div className="min-h-screen">
      <SiteHeader maxWidth="5xl" right={<GlobalNav />} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* ── Page Header ── */}
        <div className="mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-mono font-semibold tracking-wider mb-4">
            <Zap className="w-3 h-3" />
            Expression Library
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            日本人が使いこなせていない
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              厳選英語表現
            </span>
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
            「知っている」けど「口から出てこない」表現を、コアイメージとともに解説。
            make / get / take を中心に、ネイティブが多用するフレーズを厳選しました。
          </p>
        </div>

        {/* ── Level Filter (multi-select chips) ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              レベルで絞り込む（CEFR）
            </label>
            {selectedLevels.size > 0 && (
              <button
                onClick={() => setSelectedLevels(new Set())}
                className="text-[11px] text-slate-400 hover:text-indigo-500 transition-colors"
              >
                すべて表示 ({LIBRARY.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {(["A1", "A2", "B1", "B2", "C1", "C2"] as CefrKey[]).map((lv) => {
              const isActive = selectedLevels.has(lv);
              const cfg = LEVEL_CONFIG[lv];
              return (
                <button
                  key={lv}
                  onClick={() => toggleLevel(lv)}
                  className={cn(
                    "relative p-2.5 rounded-xl border text-left transition-all",
                    isActive
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                  <div className={cn(
                    "text-sm font-bold font-mono leading-none mb-1",
                    isActive ? "text-indigo-600" : "text-slate-700"
                  )}>
                    {lv}
                  </div>
                  <div className={cn(
                    "text-[10px] font-medium leading-tight",
                    isActive ? "text-indigo-500" : "text-slate-400"
                  )}>
                    {cfg.label.replace(`${lv} `, "")}
                  </div>
                  {cfg.toeic && (
                    <div className="text-[9px] text-slate-400 mt-1 leading-tight">
                      {cfg.toeic}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 単一レベル選択時のスコア詳細 */}
          {scoreDetailLevel && (
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-400">
              {LEVEL_CONFIG[scoreDetailLevel].toeic && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                  TOEIC: {LEVEL_CONFIG[scoreDetailLevel].toeic}
                </span>
              )}
              {LEVEL_CONFIG[scoreDetailLevel].toefl && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                  TOEFL iBT: {LEVEL_CONFIG[scoreDetailLevel].toefl}
                </span>
              )}
              {!LEVEL_CONFIG[scoreDetailLevel].toeic && !LEVEL_CONFIG[scoreDetailLevel].toefl && (
                <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                  ネイティブ近傍レベル
                </span>
              )}
              <span>{countByLevel(scoreDetailLevel)} 件</span>
            </div>
          )}
        </div>

        {/* ── Search + Shuffle ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="表現・日本語で検索..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShuffleKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 text-sm font-medium transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">シャッフル</span>
          </button>
          <p className="text-xs text-slate-400 font-mono ml-auto hidden sm:block">
            {displayList.length} 件
          </p>
        </div>

        {/* ── Card Grid ── */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleCards.map((entry) => (
              <ExpressionCard
                key={entry.id}
                entry={entry}
                isSavedInitially={savedExpressions.has(entry.expression.toLowerCase())}
              />
            ))}
          </div>

          {/* ── Guest gate ── */}
          {showGuestGate && (
            <div className="mt-4 relative">
              {/* Blurred preview cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 blur-sm pointer-events-none select-none opacity-60">
                {displayList.slice(visibleLimit, visibleLimit + 4).map((entry) => (
                  <ExpressionCard
                    key={entry.id}
                    entry={entry}
                    isSavedInitially={false}
                  />
                ))}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-xl px-8 py-8 text-center max-w-sm mx-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-mono font-bold text-indigo-500 uppercase tracking-widest mb-2">
                    残り {hiddenCount} 件
                  </p>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                    続きを読むには無料登録
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                    全 {LIBRARY.length} 表現・保存機能・あなた専用の英語解析が使えます。
                  </p>
                  <button
                    onClick={() => openSignIn()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all"
                  >
                    無料ではじめる
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Free user gate ── */}
          {showFreeGate && (
            <div className="mt-4 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 blur-sm pointer-events-none select-none opacity-60">
                {displayList.slice(visibleLimit, visibleLimit + 4).map((entry) => (
                  <ExpressionCard
                    key={entry.id}
                    entry={entry}
                    isSavedInitially={false}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm border border-indigo-100 rounded-2xl shadow-xl px-8 py-8 text-center max-w-sm mx-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-xs font-mono font-bold text-violet-500 uppercase tracking-widest mb-2">
                    Pro 限定 · 残り {hiddenCount} 件
                  </p>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                    全 {LIBRARY.length} 件を解放
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                    Proプランで全表現の閲覧・解析無制限・単語帳無制限が使えます。
                  </p>
                  <WaitlistCTA />
                </div>
              </div>
            </div>
          )}

          {/* 検索ゼロヒット */}
          {displayList.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">「{searchQuery}」に一致する表現が見つかりませんでした</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
