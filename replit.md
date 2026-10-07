# Circuit Kuwait

An original bilingual Kuwait electronics and hardware components storefront for students, engineers, technicians, makers and companies.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/circuit-kuwait run dev` — storefront, using its managed workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/circuit-kuwait/` — React storefront and customer/admin pages
- `artifacts/api-server/src/routes/` — catalog, customer, orders, admin and image storage API
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes
- `lib/db/src/schema/` — PostgreSQL models
- `artifacts/api-server/src/lib/seed.ts` — idempotent development sample catalog. Run with `pnpm --filter @workspace/scripts exec tsx ../artifacts/api-server/src/lib/seed.ts`.

## Architecture decisions

- Checkout is deliberately simulated. Never collect card numbers or claim payments were processed until a real payment provider is integrated.
- Never grant administrator privileges to the first registrant. Store administrators must be explicitly assigned `publicMetadata.role: "admin"` in Clerk; server-side authorization protects every administrative mutation.
- Guest carts, wishlists and demo orders belong to an unguessable HTTP-only cookie session. Signing in merges guest cart/wishlist into the Clerk customer account.
- Product prices and availability are sample catalog data, not representations of an existing Kuwait company's inventory. Business contact information and policies need owner review before launch.

## Product

Product browsing/search/filtering, specifications and datasheets, comparison, wishlist, persistent cart, Kuwait checkout, customer accounts and protected inventory/order management. KWD prices use three decimal places.

## User preferences

- Build the full frontend experience first, populated with realistic sample products; do not deliver only a static homepage.
- Original branding rather than copying RTC Electronics Kuwait.
- English and Arabic with RTL; Kuwait governorates and delivery fields.
- Requested blue/yellow palette: #0B3D91, #146CFF, #FFB703, background #F7F9FC.
- Animations should feel smooth and balanced. Page-entry fades should be noticeably slower than scroll reveals; the user found the shorter page fade too fast.

## Gotchas

- Use existing artifact-owned workflows; do not create duplicate Vite/API workflows.
- Development seeding is explicit, not a production startup migration. Publish manages production schema changes.
- Clerk auth uses the canonical host-resolved publishable key and unconditional proxy URL to work in both development and production.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
