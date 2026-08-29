import type { InvestmentCommitteeState } from "@sonar-ai/core";
import type { InstrumentStats, StressScenario } from "@sonar-ai/risk-engine";

/**
 * One run held between `POST /api/analysis/run` and its later approval. We keep
 * the deterministic risk inputs (`instrumentStats`, `stressScenarios`) next to
 * the state so the approval step can re-run the exact same risk checks the run
 * used — a model can't slip a different risk profile in between the two calls.
 */
export interface RunStoreEntry {
  state: InvestmentCommitteeState;
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
  updatedAt: string;
}

export interface RunStore {
  get(runId: string): RunStoreEntry | undefined;
  save(entry: RunStoreEntry): void;
  list(): RunStoreEntry[];
  clear(): void;
}

/**
 * In-memory run store. Deliberately simple: the demo runs in a single Next.js
 * process, so a module-level Map is enough to bridge run -> approve. It is NOT
 * durable — a server restart drops pending runs, and a horizontally scaled
 * deployment would need a shared store (Redis/Postgres). Recorded runs on disk
 * (see `record.ts`) remain the durable artifact for the demo replay.
 */
export class InMemoryRunStore implements RunStore {
  private readonly runs = new Map<string, RunStoreEntry>();

  get(runId: string): RunStoreEntry | undefined {
    return this.runs.get(runId);
  }

  save(entry: RunStoreEntry): void {
    this.runs.set(entry.state.run.id, entry);
  }

  list(): RunStoreEntry[] {
    return [...this.runs.values()];
  }

  clear(): void {
    this.runs.clear();
  }
}

// Process-wide singleton. Surviving module reloads in dev is out of scope; the
// store is only meant to bridge the two API calls of one demo session.
declare global {
   
  var __sonarRunStore: InMemoryRunStore | undefined;
}

export function getRunStore(): RunStore {
  globalThis.__sonarRunStore ??= new InMemoryRunStore();
  return globalThis.__sonarRunStore;
}
