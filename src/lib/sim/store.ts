import { Effect } from "effect";
import { GameState, GameEvent, Time, Outcome, Action } from "./domain";
import { logTransition } from "./utils";
import { apply, reportStepError, StepError, StepFail, StepOk, StepOutcome } from "./sim";


type Listener = (state:GameState, outcomes: Outcome[]) => void;


export class Store {
  state: GameState
  events: GameEvent[] = []
  #listeners = new Set<Listener>()

  constructor(initial: GameState) {
    this.state = initial
  }

  dispatch(event:Action): void {
    // TODO(s1): Effect.match folds the effect into ONE value, so both handlers must return the same shape.
    // onFailure returns StepError and onSuccess returns StepResult, so step_result is a union and cannot
    // be assigned to this.state. Decide what a failure hands back. Learn match in a scratch file first.
    const step_outcome: StepOutcome = Effect.runSync(Effect.match(apply(this.state, event), {
      onFailure: (error) => ({ ok: false, state: this.state, error }),
      onSuccess: (result) => ({ ok: true, result}),
    }))
    console.log()
    this.state = step_outcome.ok ? step_outcome.result.state : this.state // TODO: determine how to handle the error
  
    for (const listener of this.#listeners) {
    listener(this.state, step_outcome.ok ? step_outcome.result.outcomes : []); // TODO: determine how this changes if we decide to report errors
  }

  }

  subscribe(listener: Listener) {
    this.#listeners.add(listener)
    return this.#listeners.delete.bind(this.#listeners, listener)
  }

  getState(): GameState {
    return this.state
  }

  getTime(): Time {
    return { hour: this.state.hour, day: this.state.day }
  }
}


