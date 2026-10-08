type Time = { hour: number; day: number };
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
  scheduled: ScheduledMission[];
  available: AvailableMission[];
  day: number;
  hour: number;
  roster: AliveSoldierState[];
  in_progress: ActiveMission[];
  completed: CompletedMission[];
};

type CompletedMissionEvent = {
  _tag: "event/completed-mission"
  type: "MissionCompleted";
  mission_id: number;
  name: string;
};
type HourElapsedEvent = { type: "HourElapsed", _tag: "event/hour-elapsed"};
type MissionAssignmentEvent = {
  _tag: "event/mission-assignment"
  type: "MissionAssignmentEvent";
  mission_id: AvailableMission["id"];
  soldier_ids: SoldierId[];
};

type ScheduledMission = {
  _tag: "mission/scheduled"
  id: number,
  name: string,
  startsAt: Time,
  duration: number,
  requiredSolders: number,
}
type ScheduledMissionEvent = {
  _tag: "event/schedule-mission"
  type: "ScheduledMissionEvent"
  mission: ScheduledMission
}
type GameEvent =
  HourElapsedEvent | CompletedMissionEvent | MissionAssignmentEvent | ScheduledMissionEvent

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
  Time,
  ScheduledMission,
  ScheduledMissionEvent
};
