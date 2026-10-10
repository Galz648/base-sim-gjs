import { float64, Node } from "godot";
import { gd } from "../lib/gd";
import { devState } from "../lib/dev-state";
import { Sim } from "../lib/sim/sim";
import { Store } from "../lib/sim/store";
import { initialState } from "../lib/sim/seed";

const SECONDS_PER_GAME_HOUR = 2;

// The sim is plain TypeScript and runs the same under Bun (`bun run bun`) and here, inside Godot.
// Godot only hosts it: the node starts the sim and the sim ticks itself (setInterval).
@gd.class
export default class SimNode extends Node {
  speed = 1;      // 0 = paused, 2 = fast-forward
  acc = 0;
  // Milliseconds per in-game hour. An int (no decimal point in the literal): edit it in the Inspector on the Main node.
  @gd.export()
  accessor tick_ms: number = 1000;
  store: Store = new Store(initialState())
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


  _process(delta: number) {
    this.acc += delta * this.speed;
    while (this.acc >= SECONDS_PER_GAME_HOUR) {
      this.acc -= SECONDS_PER_GAME_HOUR;
      this.store.dispatch({
        type: "Tick",
        _tag: "action/tick",
        hours: this.acc
      });   // = one game hour
    }
  }
}
