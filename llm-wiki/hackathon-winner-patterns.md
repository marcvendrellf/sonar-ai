# What recent AI hackathon winners actually did

Sources:

- [OpenAI Build Week winners](../raw-sources/openai-build-week-winners-2026-08-28.md)
- [Anthropic Built with Opus 4.6 winners](../raw-sources/anthropic-opus-hackathon-winners-2026-08-28.md)
- [Google AI hackathon winners](../raw-sources/google-ai-hackathon-winners-2026-08-28.md)

## Facts from the winner pages

OpenAI published a judging rubric for Build Week: technical implementation, design and user experience, potential impact, and idea quality. The Anthropic and Google pages describe winners but do not publish comparable scoring formulas in the captured text.

The strongest projects did more than answer a prompt:

| Winner | Input | Visible transformation | Action or artifact |
| --- | --- | --- | --- |
| Anthropic TARA | Real dashcam video | Road condition, activity, costs, equity, and finance analysis | Investment-appraisal PDF |
| Anthropic CrossBeam | Blueprints and correction letters | Parallel review of spatial and regulatory issues | Permit approval plan |
| OpenAI Echo Canvas | A sketched room | Invisible acoustics become audible and editable | Interactive design workspace |
| OpenAI Mechanica | Fragmentary historical records | Evidence becomes an operable 3D reconstruction | Interactive museum object |
| OpenAI Dấu | A learner's voice | Tone becomes a visible pitch comparison | Specific physical correction |
| Google ORION | A surgeon's voice and live context | Hands-free answers and visual support | In-workflow assistance |
| Google drone-copilot | Spoken instruction and live camera | AI acts in the physical world and reports back | Drone navigation and inspection |
| Google Call My Parts | A spoken request | Research and vendor outreach run for the user | Ranked supplier dashboard |

Several winners used the model inside a harder control system:

- Pulse used a model to interpret speech while deterministic code tracked clinical state.
- Echo Canvas used AI for constrained authoring while deterministic systems handled geometry and audio.
- Sentinel combined static analysis, model review, and isolated probes. It blocked invented probes and nonexistent citations.
- Dấu used signal processing for evaluation and AI for coaching.
- Conductr used a low-latency music engine while AI changed the arrangement.

Several winners kept humans in charge:

- Second Voice asked the user to choose or edit a sentence before speaking.
- veTriage supported routing without asking receptionists or AI to make a medical decision.
- Pulse asked for confirmation when speech evidence was unclear.
- Mechanica labeled scholarly inference and showed competing reconstructions.

## Inferences for this hackathon

These are design lessons, not claims about unpublished judging decisions.

### Replace the chat box

A camera, document, voice stream, physical object, or spatial canvas creates a stronger first impression than a text prompt. Google explicitly framed its Live Agent Challenge around moving beyond a text box.

### Make an invisible system visible

The best demos reveal something the audience could not otherwise see: acoustic behavior, pronunciation shape, machine motion, road economics, or agent vulnerabilities. For finance, corporate ownership and the evidence behind a payment are good invisible systems to reveal.

### Complete the job

A summary is weak. A permit plan, appraisal PDF, ranked supplier list, operating-room display, or filing-ready package gives the user something they can act on.

### Put AI around reliable facts

The recurring architecture is deterministic facts and rules plus model explanation. For this project, Cala should provide entity and finance evidence. Rules should set review status. The model should explain and assemble the artifact.

### Make uncertainty part of the product

Successful projects did not hide ambiguity. They asked for confirmation, declined unsupported answers, or labeled inference. A finance product should distinguish "no flag found" from "safe" and "data unavailable" from "clear."

### Use one memorable reveal

The useful benchmark is not the number of agents. It is whether the audience can retell one moment after the demos. TARA's footage becoming an investment appraisal is a good model. Our equivalent can be an ordinary invoice becoming a sourced ownership and risk map.

## Applied rule for our concept

The concept should satisfy this sequence:

1. A physical or familiar object becomes the input.
2. The system resolves it to a financial entity.
3. An invisible relationship becomes visible.
4. Every surprising claim opens to evidence.
5. The flow ends with a decision artifact.

If any step is missing, the product will feel like a dashboard rather than a demonstration.
