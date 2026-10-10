import { GameState } from "./domain";

export function initialState(): GameState {
  return {
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
          day: 1,
        },
        // TODO: was `duration: 2` before the scenario work; changed to 3 without a recorded reason. Keep 3 on
        // purpose (and say why), or put it back to 2.
        duration: 3,
        _tag: "mission/scheduled",
        requiredSolders: 1,
      },
    ],
  };
}
