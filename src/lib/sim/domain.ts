interface AliveSoldierState {
  _tag: "soldier/alive";
  id: number;
  name: string;
  health: number;
  stamina: number;
  duty: "active" | "rest";
  condition: "fit" | "injured";
}
interface DeadSoldierState {
  _tag: "soldier/dead";
  id: number;
  name: string;
}
type SoldierId = AliveSoldierState["id"] | DeadSoldierState["id"];
type SoldierState = AliveSoldierState | DeadSoldierState;

type ActiveMission = {
  _tag: "mission/active";
  id: number;
  remaining: number;
  assigned: SoldierId[];
  name: string;
};
type CompletedMission = {
  _tag: "mission/completed";
  id: number;
  name: string;
};

type AvailableMission = {
  _tag: "mission/available";
  id: number;
  duration: number;
  name: string;
  requiredSolders: number;
};

type GameState = {
  available: AvailableMission[];
  day: number;
  hour: number;
  roster: AliveSoldierState[];
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
  AliveSoldierState,
  DeadSoldierState,
  SoldierId,
  ActiveMission,
  CompletedMission,
  CompletedMissionEvent,
  MissionAssignmentEvent,
};
