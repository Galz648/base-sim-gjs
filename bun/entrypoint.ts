// Bun-side runner: the same sim, no Godot. `bun run bun` (or `bun run watch:sim`).
import { Action, AssignmentAction } from "../src/lib/sim/domain";
import { CONFIG } from "../src/lib/sim/config";
import { Sim } from "../src/lib/sim/sim";
import { Store } from "../src/lib/sim/store";
import { initialState } from "../src/lib/sim/seed";

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
  const sim = new Sim(new Store(initialState()));
  let nextStep = 0;
  sim.start(CONFIG.TICK_DURATION, () => {
    const { hour } = sim.store.getTime();
    while (nextStep < scenario.length && scenario[nextStep].atHour <= hour) {
      sim.store.dispatch(scenario[nextStep].action);
      nextStep++;
    }
  });
})();
