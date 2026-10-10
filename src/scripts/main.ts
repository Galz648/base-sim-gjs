import { Node } from "godot";
import { gd } from "../lib/gd";
import { devState } from "../lib/dev-state";
import { Sim } from "../lib/sim/sim";
import { store } from "../lib/sim/game-store";
import type Clock from "./clock";
import type MissionViewer from "./mission-viewer";

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
  paused = false;
  sim: Sim = new Sim(store);
  unsub: (() => void) | null = null;
  @gd.onready("UI/Clock") accessor clock!: Clock;
  @gd.onready("UI/MissionViewer") accessor viewer!: MissionViewer;
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
    this.unsub = store.subscribe(() => this.clock.sync(store.getTime()));
    this.viewer.mission_opened.connect(() => this.setPaused(true));
    this.viewer.mission_closed.connect(() => this.setPaused(false));
    this.clock.sync(store.getTime());
    // sim.start(this.tick_ms);
  }

  _exit_tree(): void {
    this.unsub?.();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    console.log(paused ? "sim paused" : "sim resumed");
  }

  _process(delta: number) {
    if (this.paused) return;
    this.acc += delta * this.speed;
    while (this.acc >= SECONDS_PER_GAME_HOUR) {
      this.acc -= SECONDS_PER_GAME_HOUR;
      store.dispatch({
        type: "Tick",
        _tag: "action/tick",
        hours: 1
      });   // = one game hour
    }
  }
}
