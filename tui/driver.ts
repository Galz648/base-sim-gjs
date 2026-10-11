import { Effect } from "effect";
import { Action, GameState, Outcome, step as simStep, StepError } from "../src/lib/sim/api";

export type StepReport =
  | { ok: true; state: GameState; outcomes: Outcome[] }
  | { ok: false; state: GameState; error: StepError };

// The driver is the edge: it runs the sim's Effect. Today that is runSync with no services; seeded
// randomness or a fake clock would be provided here, not in the sim.
export function step(state: GameState, action: Action): StepReport {
  return Effect.runSync(
    Effect.match(simStep(state, action), {
      onFailure: (error): StepReport => ({ ok: false, state, error }),
      onSuccess: (r): StepReport => ({ ok: true, state: r.state, outcomes: r.outcomes }),
    }),
  );
}
