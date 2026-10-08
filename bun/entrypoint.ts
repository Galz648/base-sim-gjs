// Bun-side runner: the same sim, no Godot. `bun run bun` (or `bun run watch:sim`).
import { GameState } from "../src/lib/sim/domain";
import { Sim } from "../src/lib/sim/sim";
import { Store} from "../src/lib/sim/store";

(() => {
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
    scheduled: [
      {
      id: 3,
      name: "Bathroom Cleaning",
      startsAt: {
        hour: 2,
        day: 1
      },
      duration: 2,
      _tag: "mission/scheduled",
      requiredSolders: 1
    }
  ]
  }
  
  const sim = new Sim(new Store(initial_state));
  sim.start();
})();
