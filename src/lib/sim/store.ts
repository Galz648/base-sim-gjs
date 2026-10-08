import { Effect } from "effect";
import { GameState, GameEvent, Time } from "./domain";
import { logTransition } from "./utils";
import { apply, reportStepError } from "./sim";


type Listener = () => void

export class Store {
  state: GameState
  events: GameEvent[] = []
  #listeners = new Set<Listener>()

  constructor(initial: GameState) {
    this.state = initial
  }

  dispatch(event: GameEvent): void {
    const state_before = this.state
    this.state = Effect.runSync(Effect.match(apply(this.state, event), {
      onFailure: (error) => {
        reportStepError(error)
        return this.state
      },
      onSuccess: (updated) => updated,
    }))
    logTransition(state_before, event, this.state)
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


