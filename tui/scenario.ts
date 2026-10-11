import { GameState, ScheduledMission } from "../src/lib/sim/domain";

const call = (id: number, name: string, hour: number, duration: number, need: number): ScheduledMission => ({
  _tag: "mission/scheduled",
  id,
  name,
  startsAt: { day: 1, hour },
  duration,
  requiredSolders: need,
});

// Scripted, deterministic: same list every run.
export function scenario(): GameState {
  const unit = (id: number, name: string) => ({
    _tag: "soldier/alive" as const,
    id,
    name,
    health: 100,
    stamina: 100,
    duty: "rest" as const,
    condition: "fit" as const,
  });
  return {
    day: 1,
    hour: 0,
    roster: [unit(1, "Kita Alef"), unit(2, "Kita Bet"), unit(3, "Kita Gimel")],
    available: [],
    in_progress: [],
    completed: [],
    scheduled: [
      call(1, "Suspicious Object", 2, 3, 1),
      call(2, "Perimeter Alarm", 3, 2, 1),
      call(3, "Convoy Escort", 5, 4, 2),
      call(4, "Gate Inspection", 6, 1, 1),
      call(5, "Medevac Standby", 8, 3, 2),
    ],
  };
}
