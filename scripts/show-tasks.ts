/**
 * tasks/product_roadmap.md から「現在フェーズ」と、🔴 Must 直下の未チェック `- [ ]` を表示する。
 *
 *   npm run task
 *   npm run status
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const ROADMAP_REL = "tasks/product_roadmap.md";

interface PhaseBlock {
  index: number;
  headline: string;
  title: string;
  body: string;
}

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

function useColor(): boolean {
  return process.stdout.isTTY && !process.env.NO_COLOR;
}

function paint(enabled: boolean, code: string, s: string): string {
  if (!enabled) return s;
  return `${code}${s}${c.reset}`;
}

function splitPhases(md: string): PhaseBlock[] {
  const chunks = md.split(/(?=^## Phase \d+\s)/m);
  const out: PhaseBlock[] = [];
  for (const chunk of chunks) {
    const m = chunk.match(/^## Phase (\d+)\s*[—\-–]\s*(.+)$/m);
    if (!m) continue;
    const index = parseInt(m[1], 10);
    const titlePart = m[2].trim();
    const headlineLine = chunk.match(/^## Phase \d+[^\n]*/m);
    const headline = headlineLine ? headlineLine[0].replace(/^##\s+/, "") : `Phase ${index}`;
    const body = chunk.replace(/^## Phase \d+[^\n]*\n/, "").trimEnd();
    out.push({ index, headline, title: titlePart, body });
  }
  return out.sort((a, b) => a.index - b.index);
}

function extractSubsection(body: string, headingRe: RegExp): string | null {
  const lines = body.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) {
      const out: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j];
        if (/^###\s/.test(line)) break;
        if (/^##\s/.test(line)) break;
        out.push(line);
      }
      return out.join("\n");
    }
  }
  return null;
}

function extractUncheckedCheckboxLines(section: string): string[] {
  const items: string[] = [];
  const re = /^\s*-\s+\[\s*\]\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    items.push(m[1].trim());
  }
  return items;
}

function currentPhaseIndex(phases: PhaseBlock[]): number {
  for (let i = 0; i < phases.length; i++) {
    const sub = extractSubsection(
      phases[i].body,
      /^###\s+フェーズ移行条件/
    );
    if (sub && /-\s+\[\s*\]/.test(sub)) {
      return i;
    }
  }
  for (let i = 0; i < phases.length; i++) {
    if (/-\s+\[\s*\]/.test(phases[i].body)) {
      return i;
    }
  }
  return 0;
}

function mustUncheckedItems(phaseBody: string): string[] {
  const sub = extractSubsection(phaseBody, /^###\s+🔴\s*Must/);
  if (!sub) return [];
  return extractUncheckedCheckboxLines(sub);
}

function main(): void {
  const color = useColor();
  const roadmapPath = resolve(process.cwd(), ROADMAP_REL);
  let md: string;
  try {
    md = readFileSync(roadmapPath, "utf8");
  } catch {
    console.error(
      `${c.red}読み込み失敗:${c.reset} ${roadmapPath} が見つかりません。`
    );
    process.exit(1);
  }

  const phases = splitPhases(md);
  if (phases.length === 0) {
    console.error(`${c.red}Phase 見出しが見つかりません。${c.reset}`);
    process.exit(1);
  }

  const idx = currentPhaseIndex(phases);
  const phase = phases[idx];
  const mustItems = mustUncheckedItems(phase.body);

  const bar = "═══════════════════════════════════════════════════════════";

  console.log(
    paint(
      color,
      c.cyan + c.bold,
      `\n${bar}\n  LinguistLens ロードマップ · 残タスクサマリ\n${bar}\n`
    )
  );

  console.log(
    paint(color, c.magenta + c.bold, "● 現在のフェーズ（推定）"),
    "\n ",
    paint(color, c.bold, `Phase ${phase.index}`),
    paint(color, c.dim, " — "),
    phase.title,
    "\n"
  );

  console.log(
    paint(
      color,
      c.yellow + c.bold,
      "● 未完了の Must（🔴 Must 見出しの直後にある `- [ ]` 行のみ）"
    ),
    "\n"
  );

  if (mustItems.length === 0) {
    console.log(
      " ",
      paint(
        color,
        c.gray,
        "（該当なし。Must は表形式なら、`tasks/product_roadmap.md` の 🔴 Must 表を参照。トラッキング用に Must 直下へ `- [ ]` 行を足すとここに表示されます。）"
      ),
      "\n"
    );
  } else {
    for (const line of mustItems) {
      console.log(" ", paint(color, c.yellow, "☐"), line);
    }
    console.log();
  }

  console.log(
    paint(
      color,
      c.dim,
      `ソース: ${ROADMAP_REL}  ·  NO_COLOR=1 または非TTYで色なし\n`
    )
  );
}

main();
