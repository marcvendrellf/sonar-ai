# The dashboard ranks its regions instead of repeating one card treatment

Written against: 4a42f65ce108fe9875c93c7ac7f978e33ed15960

## Evidence chain

- Surface: route `/` in `apps/web` — `app/page.tsx` → `components/application-shell1.tsx` → `features/dashboard/dashboard.tsx`, including `components/blocks/activity-1.tsx`.
- Problem: the user reports the surface reads as generated. In source the pattern is uniform repetition with no ranking. Eight regions stack in one flat `space-y-5` list (`dashboard.tsx:243`), and seven of them are the same `Card` with a `CardTitle` and an explanatory `CardDescription` (`:209-210`, `:281-282`, `:302-303`, `:336-337`, `:344-346`, `activity-1.tsx:64-65`). Five metric tiles each carry a decorative `aria-hidden` lucide icon that restates its own label (`dashboard.tsx:57-93,266-268`). `Badge` appears eleven times across the surface, used both for changeable state (`:354`, `:364`, `:131`) and for static type labels that never change (`:215`, `:221`, `:227`, `:247-248`). Three different gap values run in parallel — `space-y-5`, `gap-5`, `gap-3` (`:243`, `:277`, `:259`) — with a lone `mb-8` inside the hero card (`:178`). The result is that nothing on the page is visually ranked above anything else: the deterministic risk outcome and a decorative wallet icon are given comparable weight.
- Design evidence: user evidence, given directly — the surface has "too much LLM tells". Supporting source evidence for the specific corrections below: `components/ui/card.tsx:23-30` shows `CardHeader` switches to a two-row grid only `has-data-[slot=card-description]`, so a description is a structural commitment, not decoration; `components/ui/badge.tsx:10-22` provides `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` variants, a set built to signal state rather than to label types; `app/globals.css` defines a single `--radius` scale that the surface already uses. `llm-wiki/interface-plan.md:328-338` states the acceptance test for this UI — a first-time viewer must follow mandate → agents working → evidence → disagreement → risk block → receipt without explanation, which requires a reading order the current flat stack does not provide.
- Owner: `apps/web/features/dashboard/dashboard.tsx` owns the page composition, spacing, and every region's card treatment. `apps/web/components/blocks/activity-1.tsx` owns the activity card. `apps/web/components/ui/card.tsx` and `badge.tsx` own the primitives and are not changed by this plan.
- Scope and affected surfaces: `apps/web/features/dashboard/dashboard.tsx`, `apps/web/components/blocks/activity-1.tsx`.
- Uncertainty: perceived hierarchy cannot be settled from source. Each rule below is derived from a repetition visible in source, but whether the result reads as ranked must be confirmed against the rendered page before this plan is considered done. See Validation.

## Design decision

Apply one rank rule to the whole surface: a treatment is spent where it carries information, and withheld where it does not. Concretely — an icon must carry state the text does not, a `CardDescription` must state a fact the title does not, a `Badge` must show something that can change, and one spacing scale must separate related regions from unrelated ones. This attacks the root cause rather than the symptoms: the page currently applies every available treatment to every region by default, which is exactly what makes it read as template output. Removing the defaults leaves the hero card, the deterministic risk outcome, and the decision receipt as the only strongly treated elements on the page, which is the reading order the acceptance test requires.

## Reuse

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardAction` (`apps/web/components/ui/card.tsx`) — unchanged, used less
- `Badge` variants (`apps/web/components/ui/badge.tsx`) — unchanged, used less
- The existing Tailwind spacing steps already on this surface: `3`, `4`, `8`
- `text-muted-foreground`, `text-xs`, `uppercase`, `tracking-wider` — the eyebrow treatment already exists at `activity-1.tsx:87`
- Exemplar of a region that already earns its treatment: `FundStateCard` (`dashboard.tsx:174-203`). It is the one inverted card on the page and should stay the only one.

No new primitive is required. This plan removes applications of existing primitives; it does not add a component.

## Changes

1. `apps/web/features/dashboard/dashboard.tsx:57-93` and `:260-274`
   - Change: delete the `icon` field from every entry in `metrics`, including the `data` entry if the market-data status plan has already been applied. Delete the `const Icon = metric.icon` line and the whole `<CardAction>` block at `:266-268`. Remove `Landmark`, `ArrowUpRight`, `CircleDollarSign`, `WalletCards`, and `TriangleAlert` from the `lucide-react` import at `:3-18`; after this change `metrics` is their only reference on the surface. Keep `ArrowDownRight`, which is still used by the receipt sheet at `:159`. Verify each with a search before deleting it.
   - Preserve: the label, value, and detail lines; `Card size="sm"`; `text-xl tabular-nums` on the value; the grid at `:259`.
   - Verify: each metric tile shows exactly three lines of text and no glyph. `pnpm lint` reports no unused import.

2. `apps/web/features/dashboard/dashboard.tsx` and `apps/web/components/blocks/activity-1.tsx` — descriptions
   - Change: delete the `CardDescription` at `dashboard.tsx:210` ("Every edge opens to a source record."), at `dashboard.tsx:337` ("Sources, relationships, claims, and risk checks."), and at `activity-1.tsx:65` ("Only sourced work and system checkpoints appear here."). Each restates or explains its own title. Keep `dashboard.tsx:282` ("Session history · EUR" — states a unit), `dashboard.tsx:303` ("Internal paper portfolio. No brokerage orders are available." — states a scope limit that is not derivable and is a compliance statement), `dashboard.tsx:346` ("The Marshal resized one proposed order before execution." — states an outcome), and the `CardDescription` in `FundStateCard` at `:183-185`.
   - Preserve: `CardHeader` structure for the cards that keep a description; do not replace a removed description with a smaller paragraph elsewhere.
   - Verify: four `CardDescription` instances remain on the surface, each stating a unit, a limit, or an outcome.

3. `apps/web/features/dashboard/dashboard.tsx:213-231` — path type labels
   - Change: replace the three `<Badge variant="outline" className="mb-4">` elements labelled `Event`, `Relationship`, and `Position` with `<p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">`. These label a fixed structure that never changes; a badge implies state.
   - Preserve: the three-node grid at `:213`, the `--sonar-blue` arrows at `:219,225`, and the highlighted middle node's `border-[var(--sonar-blue)]/30 bg-[var(--sonar-blue-soft)]` treatment, which is the one element in the path that does encode something.
   - Verify: no `Badge` remains inside `RelationshipPath`, and the middle node is still the only visually distinguished node.

4. `apps/web/features/dashboard/dashboard.tsx:246-249` — page header
   - Change: delete the `5 positions` badge. Its value is stated exactly by the positions table on the same screen (`:316-326`), and it goes stale the moment a position is added. Keep the `Mandate locked` badge; the mandate can unlock, so it is state.
   - Preserve: the `h1` at `:250`, the subheading at `:251`, and the `Latest decision` button at `:253-256`.
   - Verify: one badge remains in the page header.

5. `apps/web/features/dashboard/dashboard.tsx:243-374` — banding and one spacing scale
   - Change: change the `main` stack from `space-y-5` to `space-y-8`, and group the existing regions into three sibling `<div className="space-y-3">` bands inside it, in their current order and with no markup otherwise changed: band one holds the page header, the metric section, and the fund-state/NAV grid (`:244-295`); band two holds `<RelationshipPath />` and the positions/activity grid (`:297-331`); band three holds the agent-work/decision grid (`:333-374`). Change `gap-5` to `gap-3` on the three grid sections at `:277`, `:299`, and `:333` so one horizontal gap value runs across the page. Change `mb-8` to `mb-6` at `:178`.
   - Preserve: every `id` anchor — `#dashboard` (`:243`), `#saloon` (`:333`), `#decisions` (`:343`), `#mandate` (`:376`) — because `application-shell1.tsx:53-58` navigates to all four. The `sr-only` `#mandate` section stays as it is; it is out of scope here. Preserve `aria-label="Portfolio summary"` and the section order.
   - Verify: three visible gaps on the page are wider than every gap inside a band, and the anchors still scroll to the same regions.

## Scope

- Inherit: route `/` in full.
- Verify: `components/application-shell1.tsx` — its sticky header and sidebar are untouched, but confirm the wider `space-y-8` top gap does not collide with the `h-16` sticky header at `:147`.
- Exclude: `components/ui/*`. No shared primitive changes; this plan only stops over-applying them. Exclude the onboarding and Saloon surfaces, which do not exist yet. Exclude the receipt `Sheet` (`dashboard.tsx:120-172`), whose two badges are genuine state. Exclude the `source` / `system` badges in `activity-1.tsx:87-89`, which distinguish provenance per row. Exclude colour, type scale, and token changes.

## Validation

- Product: a first-time viewer follows the sequence in `llm-wiki/interface-plan.md:330-337` — mandate, agents working, evidence, disagreement, risk block, receipt — in that order, without being told where to look.
- Interface: route `/` at 390px, 768px, 1024px, and 1440px; the collapsed and expanded sidebar states from `application-shell1.tsx:125`; the open receipt `Sheet`; and `prefers-reduced-motion: reduce`, under which the NAV line and the agent-work columns must still render at final state. Capture the rendered page before and after and compare: the hero card, the resized-order row, and the receipt trigger must be the three things the eye reaches first.
- System: confirm no new spacing value, no new eyebrow class combination beyond the one already at `activity-1.tsx:87`, and no parallel card variant were introduced. Confirm the removed treatments were removed, not relocated.
- Repository: `pnpm typecheck` → passes; `pnpm lint` → passes with no unused-import warnings; `pnpm build` → passes.

## Stop conditions

- Stop if the rendered comparison does not show a clearer reading order. The rules above are derived from source repetition, not from a rendered judgement, and the outcome must be confirmed rather than assumed.
- Stop and re-sequence if the market-data status card plan has not yet been applied. That plan adds a `metrics` entry with an `icon` field; apply it first, then remove the icon field from all six entries here.
- Stop if a region loses information rather than decoration. Every deletion in this plan must be a restatement of something already on screen; if any turns out to carry a fact nothing else states, keep it and record why.
- Stop if the design owner intends `Badge` as a type label elsewhere in the product; change 3 assumes badges signal state.

## Design documentation

- After acceptance and validation: record the four rules in `llm-wiki/interface-plan.md` as a dashboard treatment section — an icon carries state the text does not, a card description states a unit, limit, or outcome, a badge shows what can change, and one spacing scale separates bands from regions — and append an entry to `llm-wiki/log.md` noting the dashboard visual-rank pass and the rendered comparison that validated it.
