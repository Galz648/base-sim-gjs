// Bun-side runner: the same sim, no Godot. `bun run bun` (or `bun run watch:sim`).
import { Sim } from "../src/lib/sim/sim";

(() => {
  const sim = new Sim({
    floor: Math.floor,
    clamp: (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max),
  });
  sim.start();
})();
