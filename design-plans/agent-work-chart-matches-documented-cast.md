# The agent-work chart names the same cast as the rest of the dashboard

Written against: 4a42f65ce108fe9875c93c7ac7f978e33ed15960

## Evidence chain

- Surface: `apps/web/features/dashboard/dashboard.tsx`, the "Agent work completed" card rendered at `dashboard.tsx:333-342`, on route `/`.
- Problem: the chart identifies the agents as `Scout, Map, Bull, Bear, Risk` (`dashboard.tsx:113-117`), while the agent activity feed rendered in the section directly above it (`dashboard.tsx:330` → `components/blocks/activity-1.tsx:21-58`) identifies the same agents as `Scout, Cartographer, Skeptic, Marshal`. A reader comparing the two cards on one screen cannot tell whether `Map` and `Cartographer` are one agent or two. The same array also omits the sixth agent, while the page header at `dashboard.tsx:251` reads "One prepared event, six agents, and an inspectable decision trail."
- Design evidence: `llm-wiki/interface-plan.md:88-99` fixes the cast as Scout, Cartographer, Analyst, Skeptic, Marshal, Trader, with Trader owning "Applies approved paper orders → Decision receipt". `llm-wiki/interface-plan.md:288-296` specifies this chart as "work completed by agent" covering sources read, relationships traced, claims challenged, risk checks run, and paper orders handled — the last of which is Trader's work. `llm-wiki/index.md:12` lists the interface plan as a current page; no later entry in `llm-wiki/log.md` supersedes the cast.
- Owner: the `agentWork` constant at `apps/web/features/dashboard/dashboard.tsx:112-118`, consumed by `AnimatedChart` at `dashboard.tsx:340`. Agent colors are owned by the `--agent-*` variables in `apps/web/app/globals.css`.
- Scope and affected surfaces: `apps/web/features/dashboard/dashboard.tsx`, `apps/web/app/globals.css`. No other file reads `agentWork`.
- Uncertainty: the repository defines five `--agent-*` colour pairs and no sixth. The hue for Trader is not determined by any cited source. This plan reuses the existing `--status-complete` pair because that token already marks completed execution on this same surface (`dashboard.tsx:360-364`), which is Trader's output. If the design owner wants a distinct sixth hue, that value must come from them, not from this plan.

## Design decision

Make the `agentWork` cast equal the documented cast, in both membership and naming. The chart is the only place on the dashboard that renames agents, and the only place that drops one; both are the same root problem — the array was written independently of the documented cast rather than derived from it. Correcting names without adding Trader would leave the header's "six agents" still overstating the screen, and adding Trader without correcting the names would add a sixth contradictory label. They are one change.

## Reuse

- `--agent-scout`, `--agent-scout-soft`, `--agent-cartographer`, `--agent-cartographer-soft`, `--agent-analyst`, `--agent-analyst-soft`, `--agent-skeptic`, `--agent-skeptic-soft`, `--agent-marshal`, `--agent-marshal-soft` (`apps/web/app/globals.css`)
- `--status-complete`, `--status-complete-soft` (`apps/web/app/globals.css`) for the Trader column
- `ColumnData` type and `AnimatedChart` (`apps/web/components/animated-chart.tsx`)
- Exemplar: `apps/web/features/dashboard/dashboard.tsx:112-118` — keep its exact shape (`id`, `title`, `value`, `className`, `topBorderClassName`)

No new primitive is required. `ColumnData` already expresses everything this change needs.

## Changes

1. `apps/web/features/dashboard/dashboard.tsx:112-118`
   - Change: set each column's `title` to the documented agent name — `scout` → `Scout`, `cartographer` → `Cartographer`, `analyst` → `Analyst`, `skeptic` → `Skeptic`, `marshal` → `Marshal`. Append a sixth entry `{ id: "trader", title: "Trader", value: 3, className: "bg-[var(--status-complete-soft)]", topBorderClassName: "border-[var(--status-complete)]" }`. The value 3 is the count of paper orders the surface already accounts for: the proposed sell, the accepted resized sell, and the cash-buffer check recorded at `dashboard.tsx:349-368`; if a fixture value for Trader's handled orders exists in the shared event store by the time this is implemented, use that instead.
   - Preserve: the `id` keys, the `satisfies ColumnData[]` annotation, the `bg-[var(--agent-*-soft)]` / `border-[var(--agent-*)]` class pairing for the five existing columns, and the `maxValue={30}` passed at `dashboard.tsx:340`.
   - Verify: the six column labels read Scout, Cartographer, Analyst, Skeptic, Marshal, Trader, left to right, and each column's fill and top border still resolve to a defined variable rather than to `transparent`.

2. `apps/web/features/dashboard/dashboard.tsx:340`
   - Change: none required, but confirm the six columns still fit. `AnimatedChart` divides width by `flex-1` per column (`components/animated-chart.tsx:58`) and each column reserves `px-3` for its label (`animated-chart.tsx:61`). If a six-column layout truncates a label such as `Cartographer` at the narrowest supported viewport, keep `h-64` and let the existing `overflow-hidden rounded-xl` class handle it — do not shorten the agent names to make them fit, because that recreates the problem this plan corrects.
   - Preserve: `maxValue={30}`, `className="h-64 overflow-hidden rounded-xl"`, and the reduced-motion behaviour in `animated-chart.tsx:52-53,100`.
   - Verify: at 390px, 768px, and 1440px viewport widths, every column renders and no label is replaced by an abbreviation.

## Scope

- Inherit: the "Agent work completed" card on `/`. It is the only consumer of `agentWork`.
- Verify: the agent activity feed (`apps/web/components/blocks/activity-1.tsx`) and the fund-state copy at `dashboard.tsx:184` — after this change all three must use the same names for the same agents.
- Exclude: adding Trader to the activity feed. The feed lists observed events, not the roster, and no cited source requires a Trader row. Exclude the Saloon, which is not built. Exclude any change to `components/animated-chart.tsx`; the registry component is correct as installed.

## Validation

- Product: a viewer reading the "Agent activity" card and then the "Agent work completed" card beside it maps every name in one to the same name in the other, and counts six agents where the header claims six.
- Interface: route `/`, the sections at `dashboard.tsx:333-342` and `dashboard.tsx:299-331`, at 390px, 768px, and 1440px; and with `prefers-reduced-motion: reduce`, where the columns must render at final height with labels intact.
- System: confirm the sixth column consumes existing CSS variables and that no new `--agent-*` variable was added to `apps/web/app/globals.css` without a decision from the design owner.
- Repository: `pnpm typecheck` → passes; `pnpm lint` → passes; `pnpm build` → passes.

## Stop conditions

- Stop if a source outside `llm-wiki/interface-plan.md` renames the cast; the documented names are the whole basis for this change.
- Stop if the design owner requires a distinct sixth colour rather than reusing `--status-complete`. Adding `--agent-trader` and `--agent-trader-soft` is a token decision, not an implementation detail, and needs their value.
- Stop if `agentWork` has by then been replaced by data from `packages/core`; in that case the names must be corrected at the source of that data, not in the component.

## Design documentation

- After acceptance and validation: append an entry to `llm-wiki/log.md` recording that the agent-work chart now uses the documented six-agent cast and that Trader borrows `--status-complete` pending a dedicated token. If a dedicated token is granted instead, record it in `llm-wiki/interface-plan.md` beside the agent table.
