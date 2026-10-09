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
- Design: Follow design-taste-frontend. Dark zinc palette (`#09090B`, `#18181B`, `#27272A`), emerald (`#10B981`) for credits/positive, rose (`#F43F5E`) for debits/debts.
- Package Manager: pnpm (`pnpm dev`, `pnpm build`, `pnpm check`).