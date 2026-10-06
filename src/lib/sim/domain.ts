interface SoldierState {
  id: number;
  name: string;
  health: number;
  stamina: number;
  duty: "active" | "rest";
  condition: "fit" | "injured";
}
type SoldierId = SoldierState["id"];

function availableToActive(
  m: Mission,
  assigned_soldier_ids: SoldierId[]
): ActiveMission {
  return {
    ...m,
    remaining: m.duration,
    assigned: assigned_soldier_ids,
  };
}
type ActiveMission = {
  id: number;
  remaining: number;
  assigned: SoldierId[];
  name: string;
};
type CompletedMission = {
  id: number;
  name: string;
};

const MISSION_STATUS = ["pending", "done", "available"] as const;
type MissionStatus = (typeof MISSION_STATUS)[number];

type Mission = {
  id: number;
  duration: number;
  name: string;
  requiredSolders: number;
  status: MissionStatus;
};

type GameState = {
  day: number;
  missions: Mission[];
  hour: number;
  roster: SoldierState[];
  in_progress: ActiveMission[];
  completed: CompletedMission[];
};

type CompletedMissionEvent = {
  type: "MissionCompleted";
  mission_id: number;
  name: string;
};
type HourElapsedEvent = { type: "HourElapsed" };
type MissionAssignmentEvent = {
  type: "MissionAssignmentEvent";
  mission_id: Mission["id"];
  soldier_ids: SoldierState["id"][];
};
type GameEvent =
  HourElapsedEvent | CompletedMissionEvent | MissionAssignmentEvent;

export { MISSION_STATUS };
export type {
  Mission,
  MissionStatus,
  GameState,
  GameEvent,
  HourElapsedEvent,
  SoldierState,
  ActiveMission,
  CompletedMission,
  CompletedMissionEvent,
};

export { availableToActive };
