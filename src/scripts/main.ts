import { Node } from "godot";
import { gd } from "../lib/gd";
import { devState } from "../lib/dev-state";
import { Sim } from "../lib/sim/sim";

// The sim is plain TypeScript and runs the same under Bun (`bun run bun`) and here, inside Godot.
// Godot only hosts it: the node starts the sim and the sim ticks itself (setInterval).
@gd.class
export default class GameRoot extends Node {
  // Milliseconds per in-game hour. An int (no decimal point in the literal): edit it in the Inspector on the Main node.
  @gd.export()
  accessor tick_ms: number = 1000;

  _ready(): void {
    const sim = new Sim();
    // Dev-only (a no-op unless `bun run dev` sets GODOTJS_DEV_STATE): keep the whole game state across relaunches.
    // The Sim replaces store.state on every dispatch, so save() reads it live. Register before start() so no tick
    // can run before the restored state is in place.
    devState("sim", {
      save: () => sim.store.state,
      load: (state) => {
        sim.store.state = state;
      },
    });
    sim.start(this.tick_ms);
  }
}
