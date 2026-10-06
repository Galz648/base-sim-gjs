import { Node } from "godot";
import { gd } from "../lib/gd";
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
    sim.start(this.tick_ms);
  }
}
