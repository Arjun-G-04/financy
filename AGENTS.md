# SvelteKit & Turso Stack
Docs: https://svelte.dev/docs/kit
Svelte 5 Docs: https://svelte.dev/docs/svelte
Turso Docs: https://docs.turso.tech/

## Project Rules
- Skills: Start every convo by reading `.agents/skills/caveman`. Prefix response with `skills: <name1>, <name2>` at the very top.
- SvelteKit Documentation: ALWAYS read the latest official documentation (via search/web tools or viewing docs) before writing any and all SvelteKit and Svelte 5 code. Never guess syntax, runes, or APIs.
- Framework Standards:
  - SvelteKit 3 + Svelte 5 with runes: `$state`, `$derived`, `$props`, `$effect`. Do NOT use Svelte 4 legacy syntax (`let:`, `export let`, `$:` reactive statements).
  - Imports: Use SvelteKit subpath imports (`#lib/*`, `#app/*`).
- Database: Turso libSQL (`@libsql/client`). Supports cloud Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`) with fallback to local `file:local.db`.
- Design: Mobile-first UI always. Thumb-friendly touch targets (min 44px), bottom nav on mobile, bottom-sheet modals, feed cards on phone vs tables on desktop, safe-area insets (`env(safe-area-inset-bottom)`), prevent iOS auto-zoom (`text-base sm:text-xs` inputs). Follow design-taste-frontend. Swiss minimalist warm stone palette (`#111110`, `#171715`, `#1c1c19`), muted emerald (`#82b896`) for credits/positive, muted rose (`#e06c75`) for debits/debts, warm gold (`#c9b48b`) for active accents.
- Package Manager: pnpm (`pnpm dev`, `pnpm build`, `pnpm check`).