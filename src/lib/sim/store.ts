import { Effect } from "effect";
import { GameState, GameEvent, Time } from "./domain";
import { logTransition } from "./utils";
import { apply, reportStepError } from "./sim";

type Store = {
  getTime(): Time;
  getState(): GameState;
  state: GameState;
  events: GameEvent[];
  dispatch(event: GameEvent): void;
  subscribe(cb: () => void): void; //TODO: return a remove callabacks
};

type Listener = () => void // TODO:  change 'void' to return type (void as placeholder)
function initializeStore(initial: GameState): Store {
  let state = initial
  let listeners: Set<Listener> = new Set()
  return {
    state,
    events: [],
    dispatch: (event: GameEvent): void => {
      const state_before = state
      state = Effect.runSync(Effect.match(apply(state, event), {
        onFailure: (error) => {
          reportStepError(error);
          Effect.log("something failed")
          return state;
        },
        onSuccess: (updated) => updated,
      }))
      logTransition(state_before, event, state);
      // TODO: call the listeners (with what parameters?)
    },
    subscribe: function (listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getState: function (): GameState {
      return this.state;
    },
    getTime: function (): Time {
      return {
        hour: this.getState().hour,
        day: this.getState().day
      }
    }
  };
}
export { Store, initializeStore }
