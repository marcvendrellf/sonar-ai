# Add Fund Wake and Committee Introduction to Onboarding

Written against: `31f0fa4`

## Evidence chain

- Surface: `/` and `/onboarding`, rendered by `apps/web/features/onboarding/onboarding-intro.tsx`.
- Problem: the current stage machine moves from asset selection directly to `complete`; it never presents Sonar's fund thesis or its six-person committee.
- Design evidence: `llm-wiki/interface-plan.md` defines Scene 4 fund-wake copy and Scene 5 committee introduction; `llm-wiki/team-workflow.md` records both scenes as unfinished onboarding work.
- Owner: `apps/web/features/onboarding/onboarding-intro.tsx` and supporting modules under `apps/web/features/onboarding/`.
- Scope and affected surfaces: onboarding stage transitions and rendered onboarding states only. `/saloon` remains the destination and is not edited by this plan.
- Uncertainty: canonical shared agent IDs are not finalized. Do not map onboarding rows to the stale `Scout`/`Cartographer` Saloon fixture without cross-lane confirmation.

## Design decision

Extend the existing linear onboarding sequence with two explicit states after asset selection:

1. Fund wake: reveal the documented Sonar thesis and expose `Initialize the fund` as the only advancement action.
2. Committee introduction: show six concise agent rows using the reviewed committee roles and outputs, alongside the existing completion summary and Saloon handoff. Keep that handoff copy unchanged until the separate final-handoff change is selected.

This makes product identity and committee structure visible before the user enters the operational room, without adding fake chat, autonomous activity, unrelated timers, or chrome to Scene 1.

## Reuse

- Existing `IntroStage` discriminated union and `AnimatePresence` transition in `apps/web/features/onboarding/onboarding-intro.tsx`.
- Existing `AnimatedQuestion`, `GlowButtonFrame`, `ShaderGradient`, `LiveOrb`, Motion transitions, and reduced-motion branch in `apps/web/features/onboarding/onboarding-intro.tsx`.
- `TextGradient` in `apps/web/components/text-gradient.tsx` for the single short status line required by Scene 4.
- `Card`, `Avatar`, and `Badge` composition demonstrated by `apps/web/components/blocks/activity-1.tsx`.
- Exemplar only: `apps/web/features/saloon/agent-roster.tsx` for compact row hierarchy and state-badge treatment. Do not reuse its data or old six-agent names from `apps/web/features/saloon/run-fixture.ts`.

No new shared primitive is required.

## Changes

1. `apps/web/features/onboarding/onboarding-intro.tsx`
   - Change: add typed `fund-wake` and `committee-intro` stages carrying the existing mandate context (`displayName`, budget, risk profile, and selected asset classes). Change `completeMandate()` to enter `fund-wake` after storing the selected classes; render the existing completion summary and Saloon link within `committee-intro` so no new intermediate action is invented.
   - Change: render Scene 4 with exact copy: eyebrow `An agentic paper fund`; headline `It does not trade the headline.`; reveal `It trades the relationships behind it.`; short status `Establishing mandate...`; primary action `Initialize the fund`.
   - Change: make the fund-wake action advance to `committee-intro` through one ordinary Motion transition. Keep the existing orb and pale Shader Gradient visual language; use no unrelated delay or simulated progress. Render `TextGradient` for `Establishing mandate...` only when motion is allowed; use a static equivalent with reduced motion.
   - Change: render Scene 5 as a compact six-row roster. Each row must show name, role, status, and current task/output. Use these exact reviewed roles and outputs: Portfolio Manager / Allocation proposal; Fundamental Analyst / Fundamental report; Market Context Analyst / Context report; Risk Officer / Risk report; Bear/Critic / Counter-case; Report Writer / Internal report.
   - Change: keep roster status deterministic and explicitly presentation-scoped. Use one neutral `Ready` fixture status until typed orchestrator status exists. No fake typing, background worker timers, or claims that research has already run. If a shared committee contract is available, consume its stable IDs; otherwise use a local typed onboarding projection with the exact reviewed role labels and stop before inventing alternate agent identities.
   - Preserve: Scene 1's orb-only greeting, Scene 2's €1,000 baseline, Scene 3's mandate cards, keyboard submission, reduced-motion behavior, WebGL fallback, local-storage writes, and existing final Saloon link.
   - Verify: after locking assets, user sees fund-wake copy; `Initialize the fund` reveals committee rows plus existing final handoff; refresh-free pointer and keyboard paths remain intact.

2. `apps/web/features/onboarding/` (only if composition exceeds current file size)
   - Change: extract fund-wake and committee-intro view code into feature-local components while keeping stage ownership in `onboarding-intro.tsx`.
   - Preserve: no global CSS or shared contract edits unless required by an approved cross-lane decision.
   - Verify: extracted components receive typed props and do not import Saloon runtime state or stale fixture data.

## Scope

- Inherit: `/` and `/onboarding` receive identical new states because both routes render `OnboardingIntro`.
- Verify: `apps/web/app/page.tsx`, `apps/web/app/onboarding/page.tsx`, `apps/web/components/text-gradient.tsx`, and onboarding-owned Motion/reduced-motion behavior.
- Exclude: Scene 1 visual redesign; asset terminology; final Scene 6 wording (`committee online`, `mandate locked`, `initial paper portfolio ready`, `Start portfolio review`); Saloon roster migration; shared `packages/core` contract changes; orchestrator behavior.

## Validation

- Product: complete onboarding through asset selection; confirm fund-wake thesis appears, `Initialize the fund` advances, six reviewed roles appear, and existing Saloon handoff remains available.
- Interface: test `/` and `/onboarding`; name at maximum length; narrow mobile width; desktop presentation width; all asset selections; reduced motion; keyboard Enter and focus order; WebGL failure fallback.
- System: confirm Scene 1 still has no branding, instructions, footer, or secondary copy; confirm no stale Scout/Cartographer/Marshal/Trader labels enter new onboarding rows; confirm no autonomous timers or filler activity are added.
- Repository: `pnpm --filter web typecheck` → passes.
- Repository: `pnpm --filter web lint` → passes.
- Repository: `pnpm --filter web build` → passes.

## Stop conditions

- Stop if canonical shared committee IDs or role names conflict with the reviewed six-role topology; resolve ownership with Marc plus the contracts owner before mapping data.
- Stop if implementing the roster requires editing `packages/core`, `apps/web/features/saloon/`, global CSS, or shared fixtures; split that work into a coordinated contract or Saloon plan.
- Stop if the fund-wake scene requires new timers to fake agent activity; keep transition user-driven and presentation-only.

## Design documentation

- After acceptance and validation: update the onboarding status paragraph in `llm-wiki/team-workflow.md` and the current implementation paragraph in `llm-wiki/overview.md`; append one dated entry to `llm-wiki/log.md`.
