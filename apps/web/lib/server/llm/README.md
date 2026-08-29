# `llm` — OpenAI client (Phase 5)

The thin wrapper the `OpenAIAgentRunner` uses. All agents run on OpenAI with
structured outputs + function calling.

Planned files:

- `openai-client.ts` — constructs the client from `env.ts`
  (`OPENAI_API_KEY`, optional `OPENAI_BASE_URL` / `OPENAI_ORG_ID` /
  `OPENAI_PROJECT_ID`), applies `SONAR_AGENT_MODEL`, `SONAR_AGENT_MAX_TOKENS`,
  and `SONAR_AGENT_MAX_RETRIES`.
- `structured-output.ts` — Zod → JSON schema (via `z.toJSONSchema`), call the
  model with the schema, parse and validate the result. Invalid → one bounded
  retry → the orchestrator falls back to the fixture.

Rules:

- Never expose prompts, credentials, or raw model reasoning past this layer —
  only the validated typed output crosses into the orchestrator.
- Keep calls bounded and deterministic enough to replay for the demo.
