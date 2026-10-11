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
    roster: [unit(1, "Unit-A"), unit(2, "Unit-B"), unit(3, "Unit-C")],
    available: [],
    in_progress: [],
    completed: [],
    scheduled: [
      call(1, "Burglary", 2, 3, 1),
      call(2, "Traffic Collision", 3, 2, 1),
      call(3, "Armed Robbery", 5, 4, 2),
      call(4, "Noise Complaint", 6, 1, 1),
      call(5, "Fire Alarm", 8, 3, 2),
    ],
  };
}
