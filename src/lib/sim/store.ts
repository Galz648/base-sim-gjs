import { Effect } from "effect";
import { GameState, GameEvent, Time, Outcome, Action } from "./domain";
import { logTransition } from "./utils";
import { apply, reportStepError } from "./sim";


type Listener = (state:GameState, outcomes: Outcome[]) => void;


export class Store {
  state: GameState
  events: GameEvent[] = []
  #listeners = new Set<Listener>()

  constructor(initial: GameState) {
    this.state = initial
  }

  dispatch(event:Action): void {
    // const step_result = Effect.runSync(Effect.match(apply(this.state, event), {
    //   onFailure: (outcomes) => {
    //     reportStepError(outcome)
    //     return 
    //   },
    //   onSuccess: (updated) => updated,
    // }))
    // logTransition(state_before, , this.state)
    console.log("Transition Should be logged")
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


