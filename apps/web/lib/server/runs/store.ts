import { InvestmentCommitteeStateSchema, type InvestmentCommitteeState } from "@sonar-ai/core";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const runs = new Map<string, InvestmentCommitteeState>();
let loaded = false;

function storePath(): string {
  return process.env.SONAR_RUN_STORE_PATH ?? join(process.cwd(), "data", "analysis-runs.json");
}

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    const raw = JSON.parse(readFileSync(/*turbopackIgnore: true*/ storePath(), "utf8")) as unknown;
    if (!Array.isArray(raw)) return;
    for (const candidate of raw) {
      const parsed = InvestmentCommitteeStateSchema.safeParse(candidate);
      if (parsed.success) runs.set(parsed.data.run.id, parsed.data);
    }
  } catch {
    // Missing or corrupt persistence must not prevent offline fixture startup.
  }
}

function persist(): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, JSON.stringify([...runs.values()]), "utf8");
  renameSync(tempPath, path);
}

export function saveRun(state: InvestmentCommitteeState): void {
  load();
  const validated = InvestmentCommitteeStateSchema.parse(state);
  runs.set(validated.run.id, structuredClone(validated));
  persist();
}

export function getRun(runId: string): InvestmentCommitteeState | undefined {
  load();
  const state = runs.get(runId);
  return state ? structuredClone(state) : undefined;
}

export function getLatestRun(): InvestmentCommitteeState | undefined {
  load();
  const latest = [...runs.values()].sort((a, b) =>
    Date.parse(b.run.startedAt) - Date.parse(a.run.startedAt),
  )[0];
  return latest ? structuredClone(latest) : undefined;
}

export function listRuns(): InvestmentCommitteeState[] {
  load();
  return [...runs.values()]
    .sort((a, b) => Date.parse(a.run.startedAt) - Date.parse(b.run.startedAt))
    .map((state) => structuredClone(state));
}
