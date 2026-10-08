import { float64, Node } from "godot";
import { gd } from "../lib/gd";
import { devState } from "../lib/dev-state";
import { Sim, Store } from "../lib/sim/sim";
import { initializeStore } from "../lib/sim/store";
import { GameState } from "../lib/sim/domain";

// The sim is plain TypeScript and runs the same under Bun (`bun run bun`) and here, inside Godot.
// Godot only hosts it: the node starts the sim and the sim ticks itself (setInterval).
const initial_state: GameState = {
  roster: [
    {
      _tag: "soldier/alive",
      id: 2,
      name: "Gal",
      health: 100,
      stamina: 50,
      duty: "rest",
      condition: "fit",
    },
    {
      _tag: "soldier/alive",
      id: 1,
      name: "Nir",
      health: 100,
      stamina: 100,
      duty: "active",
      condition: "fit",
    },
  ],
  day: 1,
  available: [
    {
      id: 1,
      duration: 6,
      name: "Recon Patrol",
      requiredSolders: 1,
      _tag: "mission/available",
    },
  ],
  hour: 1,
  in_progress: [
    {
      id: 1,
      remaining: 6,
      assigned: [1],
      name: "Supply Run",
      _tag: "mission/active",
    },
  ],
  completed: [],
  scheduled: [{
    id: 3,
    name: "Bathroom Cleaning",
    startsAt: {
      hour: 1,
      day: 1
    },
    duration: 2,
    _tag: "mission/scheduled",
    requiredSolders: 1
  }]
}
@gd.class
export default class SimNode extends Node {
  // Milliseconds per in-game hour. An int (no decimal point in the literal): edit it in the Inspector on the Main node.
  @gd.export()
  accessor tick_ms: number = 1000;
  store: Store = initializeStore(initial_state)
  sim: Sim = new Sim(this.store)
  _ready(): void {
    // Dev-only (a no-op unless `bun run dev` sets GODOTJS_DEV_STATE): keep the whole game state across relaunches.
    // The Sim replaces store.state on every dispatch, so save() reads it live. Register before start() so no tick
    // can run before the restored state is in place.
    devState("sim", {
      save: () => this.sim.store.state,
      load: (state) => {
        this.sim.store.state = state;
      },
    });
    // sim.start(this.tick_ms);
  }

  _process(delta: float64): void {
    this.sim.store.dispatch({
      type: "HourElapsed",
      _tag: "event/hour-elapsed"
    })
  }
}
