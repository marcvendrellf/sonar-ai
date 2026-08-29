# `llm` — OpenAI Responses client

Thin wrapper used by `OpenAIAgentRunner`. Live agents use official `openai`
TypeScript SDK and Responses API structured outputs.

Implemented files:

- `openai-client.ts` — constructs the client from `env.ts`
  (`OPENAI_API_KEY`, optional `OPENAI_BASE_URL` / `OPENAI_ORG_ID` /
  `OPENAI_PROJECT_ID`). SDK automatic retries are disabled and timeout is
  bounded by `SONAR_AGENT_TIMEOUT_MS`.
- `structured-output.ts` — sends one `responses.parse()` request using
  `zodTextFormat`, disables response storage, and validates parsed output again
  at the application boundary.
- `../analysis/runner/openai-runner.ts` — applies model, token, and exact retry
  settings. It returns only typed output and token usage.

Rules:

- Never expose prompts, credentials, or raw model reasoning past this layer —
  only the validated typed output crosses into the orchestrator.
- No tools or model-selected routing. Code owns stage order, gates, retries, and
  paper-ledger mutation.
- `SONAR_OFFLINE=true` rejects live-client construction. Offline runs use
  `StubAgentRunner`; live model failure does not silently change control flow.
