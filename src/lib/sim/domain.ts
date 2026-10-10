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
type HourElapsedEvent = { type: "tick", _tag: "input/tick"};
type MissionAssignmentEvent = {
  _tag: "event/mission-assignment"
  type: "MissionAssignmentEvent";
  mission_id: AvailableMission["id"];
  soldier_ids: SoldierId[];
};

type TickAction =   { _tag: "action/tick"; type: "Tick"; hours: number }
type AssignmentAction = { _tag: "action/assign"; type: "Assign"; missionId: number; soldierIds: SoldierId[]};
type Action  = TickAction | AssignmentAction



type Outcome =  // Expected game outcome
  { _tag: "outcome/mission-available"; type: "MissionAvailable"; missionId: string }
| { _tag: "outcome/mission-completed"; type: "MissionCompleted"; missionId: string; soldierIds: SoldierId[] }
| { _tag: "outcome/assign-rejected"; type: "AssignRejected"; missionId: string; soldierIds: SoldierId[] }
| { _tag: "outcome/assignment-accepted"; type: "AssignAccepted"; missionId: string; soldierIds: SoldierId[] }


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
  ScheduledMissionEvent,
  Outcome,
  Action,
  TickAction,
  AssignmentAction
};
