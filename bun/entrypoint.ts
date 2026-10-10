// Bun-side runner: the same sim, no Godot. `bun run bun` (or `bun run watch:sim`).
import { Action, AssignmentAction, GameState } from "../src/lib/sim/domain";
import { CONFIG } from "../src/lib/sim/config";
import { Sim } from "../src/lib/sim/sim";
import { Store } from "../src/lib/sim/store";

// Gal is resting, so Bathroom Cleaning (opens at hour 2) accepts him.
const assignGal: AssignmentAction = {
  _tag: "action/assign",
  type: "Assign",
  missionId: 3,
  soldierIds: [2],
};
// Nir is still out on Supply Run, so Recon Patrol rejects him.
const assignNir: AssignmentAction = {
  _tag: "action/assign",
  type: "Assign",
  missionId: 3,
  soldierIds: [1],
};

const acceptScenario: { atHour: number; action: Action }[] = [
  { atHour: 3, action: assignGal },
  { atHour: 3, action: assignNir },
];

// Recon Patrol is already available. Nir is on Supply Run, so this assign rejects.
const assignNirWhileOut: AssignmentAction = {
  _tag: "action/assign",
  type: "Assign",
  missionId: 1,
  soldierIds: [1],
};

const rejectScenario: { atHour: number; action: Action }[] = [
  { atHour: 1, action: assignNirWhileOut },
];

const scenario = rejectScenario;

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
      duration: 3,
      _tag: "mission/scheduled",
      requiredSolders: 1
    }
  ]
  }
  
  const sim = new Sim(new Store(initial_state));
  let nextStep = 0;
  sim.start(CONFIG.TICK_DURATION, () => {
    const { hour } = sim.store.getTime();
    while (nextStep < scenario.length && scenario[nextStep].atHour <= hour) {
      sim.store.dispatch(scenario[nextStep].action);
      nextStep++;
    }
  });
})();
