import { GameState, GameEvent, Time, Outcome, Action } from "./domain";
import { runStep, StepResult } from "./sim";


type Listener = (result: StepResult) => void;


export class Store {
  state: GameState
  events: GameEvent[] = []
  #listeners = new Set<Listener>()

  constructor(initial: GameState) {
    this.state = initial
  }

  dispatch(event:Action): void {
    const step_result: StepResult = runStep(this.state, event);

    if (step_result.ok) {
      this.state = step_result.result.state
    } else { // state is not reassigned
    }
  
    for (const listener of this.#listeners) {
    listener(step_result); // TODO: determine how this changes if we decide to report errors
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


