import type { InvestmentCommitteeState, UserDecision } from "@sonar-ai/core";
import type { InstrumentStats, StressScenario } from "@sonar-ai/risk-engine";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AnalysisOrchestrator } from "../analysis/orchestrator";
import type { AgentRunner } from "../analysis/runner/types";
import { StubAgentRunner } from "../analysis/runner/stub-runner";
import {
  RecordingAgentRunner,
  RunRecordingSchema,
  recordingToStubOutputs,
  resetToIdle,
  type RunRecording,
} from "./recording";

export interface RecordRunInput {
  /** An idle, validated committee state (inputs + evidence + graph). */
  state: InvestmentCommitteeState;
  /** Provide to record the full run through approval; omit to stop at the gate. */
  userDecision?: UserDecision;
  /** The runner to record — an OpenAIAgentRunner for a real run. */
  runner: AgentRunner;
  /** Label for the model that produced this run (e.g. "gpt-5", "stub"). */
  model: string;
  instrumentStats?: InstrumentStats;
  stressScenarios?: readonly StressScenario[];
  /** Injectable clock for deterministic tests. */
  clock?: () => string;
}

/**
 * Run the committee once through a recording wrapper and return the transcript
 * plus the final state. Swap `runner` for the OpenAIAgentRunner to capture a
 * real GPT-5 run ahead of demo time.
 */
export async function recordCommitteeRun(
  input: RecordRunInput,
): Promise<RunRecording> {
  const recorder = new RecordingAgentRunner(input.runner, input.clock);
  const orchestrator = new AnalysisOrchestrator({
    runner: recorder,
    ...(input.instrumentStats ? { instrumentStats: input.instrumentStats } : {}),
    ...(input.stressScenarios ? { stressScenarios: input.stressScenarios } : {}),
  });

  const state = await orchestrator.run({
    state: input.state,
    ...(input.userDecision ? { userDecision: input.userDecision } : {}),
  });

  const now = (input.clock ?? (() => new Date().toISOString()))();
  return RunRecordingSchema.parse({
    runId: state.run.id,
    recordedAt: now,
    model: input.model,
    scenarioId: state.run.scenarioId,
    userDecision: state.userDecision,
    ...(input.instrumentStats ? { instrumentStats: input.instrumentStats } : {}),
    ...(input.stressScenarios ? { stressScenarios: [...input.stressScenarios] } : {}),
    turns: recorder.turns,
    state,
  });
}

/**
 * Replay a recording OFFLINE: feed its recorded outputs back through the stub
 * runner so the orchestrator reproduces the exact same state — no network, no
 * model. Deterministically equal to the recorded `state`.
 */
export async function replayRecording(
  recording: RunRecording,
): Promise<InvestmentCommitteeState> {
  const runner = new StubAgentRunner(recordingToStubOutputs(recording));
  const orchestrator = new AnalysisOrchestrator({
    runner,
    ...(recording.instrumentStats ? { instrumentStats: recording.instrumentStats } : {}),
    ...(recording.stressScenarios ? { stressScenarios: recording.stressScenarios } : {}),
  });
  return orchestrator.run({
    state: resetToIdle(recording.state),
    ...(recording.userDecision ? { userDecision: recording.userDecision } : {}),
  });
}

/** Where recorded runs live. Sanitized JSON only — never a credential. */
export const DEFAULT_RUNS_DIR = join(process.cwd(), "fixtures", "runs");

export async function saveRecording(
  recording: RunRecording,
  dir: string = DEFAULT_RUNS_DIR,
): Promise<string> {
  const path = join(dir, `${recording.runId}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(recording, null, 2), "utf8");
  return path;
}

export async function loadRecording(path: string): Promise<RunRecording> {
  return RunRecordingSchema.parse(JSON.parse(await readFile(path, "utf8")));
}

/**
 * Load the most recently modified recording in `dir`, or `null` if none exist.
 * Used offline as the committee's "brain": its recorded outputs drive the stub
 * runner so `/api/analysis/run` can produce a real committee result with no key.
 */
export async function loadLatestRecording(
  dir: string = DEFAULT_RUNS_DIR,
): Promise<RunRecording | null> {
  let files: string[];
  try {
    files = (await readdir(dir)).filter((name) => name.endsWith(".json"));
  } catch {
    return null; // Directory absent = no recordings yet.
  }
  if (files.length === 0) return null;

  const withMtime = await Promise.all(
    files.map(async (name) => {
      const path = join(dir, name);
      return { path, mtimeMs: (await stat(path)).mtimeMs };
    }),
  );
  withMtime.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return loadRecording(withMtime[0]!.path);
}
