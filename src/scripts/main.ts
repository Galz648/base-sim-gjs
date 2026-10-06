import { Node } from "godot";
import { createClassBinder } from "godot.annotations";
import { Sim } from "../lib/sim/sim";

const bind = createClassBinder();

// The sim is plain TypeScript and runs the same under Bun (`bun run bun`) and here, inside Godot.
// Godot only hosts it: the node starts the sim and the sim ticks itself (setInterval).
@bind()
export default class GameRoot extends Node {
  _ready(): void {
    const sim = new Sim();
    sim.start();
  }
}
