interface SoldierState {
  id: number;
  name: string;
  health: number;
  stamina: number;
  duty: "active" | "rest";
  condition: "fit" | "injured";
}
type SoldierId = SoldierState["id"];


type ActiveMission = {
  _tag: "active";
  id: number;
  remaining: number;
  assigned: SoldierId[];
  name: string;
};
type CompletedMission = {
  _tag: "completed";
  id: number;
  name: string;
};

type AvailableMission = {
  _tag: "available";
  id: number;
  duration: number;
  name: string;
  requiredSolders: number;
};

type GameState = {
  available: AvailableMission[];
  day: number;
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
  mission_id: AvailableMission["id"];
  soldier_ids: SoldierId[];
};
type GameEvent =
  HourElapsedEvent | CompletedMissionEvent | MissionAssignmentEvent;

export type {
  AvailableMission,
  GameState,
  GameEvent,
  HourElapsedEvent,
  SoldierState,
  ActiveMission,
  CompletedMission,
  CompletedMissionEvent,
  SoldierId,
  MissionAssignmentEvent,
};
