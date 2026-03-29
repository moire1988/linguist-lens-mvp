# LinguistLens MVP — Claude Code Instructions

## Tech Stack
- **Next.js 14.2.35** — App Router, TypeScript
- **Node.js 20.3.1** — set via `.node-version` in project root
- **Tailwind CSS** — manual setup (no shadcn CLI)
- **Anthropic SDK** `@anthropic-ai/sdk` — model: `claude-3-5-sonnet-20241022`
- **Supabase** — auth + vocabulary DB (RLS enabled)
- **Dev server**: `npm run dev` → http://localhost:3000

## Critical Gotchas
- Config file MUST be `next.config.js` — `next.config.ts` is NOT supported in Next.js 14
- Node version enforcement: always use nodenv with `.node-version` (20.3.1)
- No `create-next-app` was used — project was bootstrapped manually
- Netflix: DRM prevents direct URL scraping — users paste subtitles into the text tab

## Git Workflow
- **All development on `develop` branch** — never commit directly to `main`
- `main` receives merges from `develop` only
- Always run `git checkout develop` before starting work

## Build & Verify Commands
```bash
npx tsc --noEmit    # TypeScript type-check (run after any .ts/.tsx changes)
npm run lint        # ESLint
npm run build       # Full build + SSG for /library/grammar routes
npm run dev         # Dev server
```
Run `npx tsc --noEmit` before every commit. Fix all type errors — don't use `any` to silence them.

## Architecture Rules

### Server vs Client
- Server Actions → `app/actions/*.ts`
- Client components → must have `"use client"` at top of file
- Default to Server Components; add `"use client"` only when needed (hooks, events, browser APIs)

### Supabase Security
- **Admin operations** (Server Actions): use `createAdminClient()` from `lib/db/`
- **Auth/user operations** (client-side): use `createAuthClient()`
- RLS policies are enabled — always test queries as both authenticated and anonymous users
- Never expose the service role key to the client

### Data Layer
- Supabase CRUD → `lib/db/vocabulary.ts`
- Vocabulary Server Actions → `app/actions/vocabulary.ts`
- Grammar content (static) → `data/grammar-lessons.ts` (no DB)
- Library content (static) → `data/library.json` (no DB)

### AI Integration
- All Claude API calls go through `app/actions/analyze.ts` (Server Action)
- Input text: truncated to 5500 chars; web scraping: 8000 chars
- Returns strict JSON array — validate before rendering

## File Structure
```
app/
  actions/          Server Actions (analyze.ts, vocabulary.ts)
  library/
    grammar/[slug]/ Grammar feature pages (SSG)
  page.tsx          Top page: URL/text input, CEFR selector
components/         Client components
data/               Static content (library.json, grammar-lessons.ts)
lib/                Utility functions, DB clients
scripts/            Node.js scripts (post-to-x.ts, etc.)
```

## Code Style
- 2-space indentation
- ES module imports (no CommonJS `require`)
- TypeScript strict — type all props and function signatures
- `cn()` from `lib/utils.ts` for conditional Tailwind class merging
- Icons: `lucide-react` only
- Toasts: `sonner` only

## Security Rules
- Never read or write `.env` / `.env.local` files — use existing env vars via `process.env`
- Never log `ANTHROPIC_API_KEY` or any secret to console
- Sanitize all user input before passing to Claude API
- Never expose Supabase service role key in client-side code

## Document Generation Rules（ドキュメント生成の厳格なルール）
AIが実装指示書・要件定義・計画ファイルを生成する際に**必ず**守ること。

1. **保存先は `tasks/` 配下のみ** — 実装指示書・要件定義・`task_plan.md`・`findings.md`・`progress.md` などの中間ファイルはすべて `tasks/` ディレクトリ内に生成する。
   - ファイル名規則: `tasks/YYYYMMDD-feature-name.md`（例: `tasks/20260329-chrome-extension-teaser.md`）
2. **プロジェクトルート直下への中間ファイル生成は禁止** — `task_plan.md`・`findings.md` 等をルート直下に置かない。
3. **出力はファイルとして残す** — 実装指示を標準出力テキストだけで終わらせず、必ず `tasks/` 内にファイルとして書き出してから作業を終えること。
4. **`tasks/` が存在しない場合は自動作成する。**
