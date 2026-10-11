import { Effect } from "effect";
import { Action, GameState, Outcome } from "../src/lib/sim/domain";
import { apply, StepError } from "../src/lib/sim/sim";

export type StepReport =
  | { ok: true; state: GameState; outcomes: Outcome[] }
  | { ok: false; state: GameState; error: StepError };

// One command in, one sim step out. Only place the TUI touches Effect.
export function step(state: GameState, action: Action): StepReport {
  return Effect.runSync(
    Effect.match(apply(state, action), {
      onFailure: (error): StepReport => ({ ok: false, state, error }),
      onSuccess: (r): StepReport => ({ ok: true, state: r.state, outcomes: r.outcomes }),
    }),
  );
}
