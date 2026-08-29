# The metric row states whether market data is live or fixture

Written against: 4a42f65ce108fe9875c93c7ac7f978e33ed15960

## Evidence chain

- Surface: `apps/web/features/dashboard/dashboard.tsx`, the "Portfolio summary" section rendered at `dashboard.tsx:259-275`, on route `/`.
- Problem: the metric row renders five cards — Paper NAV, Daily paper P&L, Gross exposure, Available cash, Active risk flags (`dashboard.tsx:57-93`). The documented top row has six, and the missing one is the market-data status card. Every number in that row is a fixture value, and the row itself says nothing about that. The only statements of data provenance on the whole surface sit outside the row and outside the reading path for the numbers: a sidebar footer label "Fixture mode / Historical replay" (`components/application-shell1.tsx:113-114`) and a header note "All orders simulated" (`application-shell1.tsx:159`), which speaks to orders, not to data.
- Design evidence: `llm-wiki/interface-plan.md:274-282` specifies the top row as cards for paper NAV; **eToro market-data status, clearly labeled live or fixture**; daily paper P&L; gross exposure; available cash; active risk flags. `llm-wiki/index.md:12` lists the interface plan as current. `llm-wiki/log.md` records eToro as read-only market or reference data subject to verification, and records the current dashboard as fixture-driven; no entry supersedes the six-card row.
- Owner: the `metrics` constant at `apps/web/features/dashboard/dashboard.tsx:57-93` and its renderer at `dashboard.tsx:259-275`.
- Scope and affected surfaces: `apps/web/features/dashboard/dashboard.tsx` only.
- Uncertainty: none for the value. The repository states the current state is a historical replay in `llm-wiki/overview.md:77` and on the surface itself at `application-shell1.tsx:113-114`, so `Fixture` is the correct current label.

## Design decision

Add the documented sixth card and widen the row to six columns. The provenance of the numbers belongs in the row that shows the numbers, not only in a sidebar footer a reader may never look at; that is why the interface plan places it there rather than in the shell. Adding the card rather than annotating each existing card keeps one owner for the statement and matches the documented composition.

## Reuse

- `Card` with `size="sm"`, `CardHeader`, `CardDescription`, `CardAction`, `CardTitle`, `CardContent` (`apps/web/components/ui/card.tsx`)
- `--status-complete`, `--status-review` (`apps/web/app/globals.css`) — already used on this surface for outcome colour at `dashboard.tsx:354,364`
- `RadioTower` from `lucide-react`, already the data/signal mark on this surface at `components/application-shell1.tsx:66`
- Exemplar: `apps/web/features/dashboard/dashboard.tsx:57-93` and the map at `:260-274`. The new entry uses the identical `{ id, label, value, detail, icon }` shape and needs no special-case rendering.

No new primitive is required.

## Changes

1. `apps/web/features/dashboard/dashboard.tsx:57-93`
   - Change: insert a second entry in `metrics`, directly after `nav`, matching the documented order: `{ id: "data", label: "Market data", value: "Fixture", detail: "eToro not connected", icon: RadioTower }`. Add `RadioTower` to the `lucide-react` import at `dashboard.tsx:3-18`, keeping the import list alphabetical as it currently is.
   - Preserve: the `as const` annotation, the existing five entries and their order relative to each other, and the `icon` field shape.
   - Verify: the row reads Paper NAV, Market data, Daily paper P&L, Gross exposure, Available cash, Active risk flags.

2. `apps/web/features/dashboard/dashboard.tsx:259`
   - Change: widen the grid from `lg:grid-cols-5` to `lg:grid-cols-6` so six cards form one row rather than five plus an orphan. Keep `sm:grid-cols-2` and `gap-3` unchanged.
   - Preserve: `aria-label="Portfolio summary"`, the `Card size="sm"` treatment, and the `text-xl tabular-nums` value styling at `dashboard.tsx:269`.
   - Verify: at 1440px the six cards sit on one row with no wrap; at 768px they wrap two-up; at 390px they stack.

3. `apps/web/features/dashboard/dashboard.tsx:269`
   - Change: none to the shared class, but confirm `Fixture` renders acceptably under `tabular-nums` alongside numeric siblings. `tabular-nums` affects digits only and is harmless on a word; do not add a per-card override.
   - Preserve: one value treatment across all six cards.
   - Verify: the `Market data` value sits on the same baseline and at the same size as `€1,018,420` beside it.

## Scope

- Inherit: the Portfolio summary section on `/`.
- Verify: `components/application-shell1.tsx:113-114` and `:159`. Those statements stay, but after this change the row is the primary statement of provenance; if they later contradict it, the row is authoritative.
- Exclude: wiring a real eToro status. No eToro client exists in this repository, and the interface plan requires only that the label be clear about which state applies. Exclude changing the copy in the shell. Exclude the other dashboard sections.

## Validation

- Product: a viewer reading the metric row learns that the figures beside it come from a fixture, without visiting the sidebar.
- Interface: route `/`, section `dashboard.tsx:259-275`, at 390px, 768px, 1024px, and 1440px. Check the longest label, `Active risk flags`, and the longest value, `€1,018,420`, in a six-column row for truncation.
- System: confirm the new card is a plain `metrics` entry rendered by the existing map, with no bespoke card branch introduced beside it.
- Repository: `pnpm typecheck` → passes; `pnpm lint` → passes; `pnpm build` → passes.

## Stop conditions

- Stop if a real eToro connection has landed by implementation time; the value must then reflect the live connection state rather than the literal `Fixture`, and the source of that state needs to be agreed first.
- Stop if six cards cannot hold one row at 1440px without truncating a label. The fallback is not to shorten the documented labels but to raise the row treatment with the design owner.

## Design documentation

- After acceptance and validation: append an entry to `llm-wiki/log.md` recording that the metric row now carries the documented market-data status card and that its value is a literal `Fixture` until an eToro status source exists. Update `llm-wiki/overview.md:77` so the described dashboard state matches.
