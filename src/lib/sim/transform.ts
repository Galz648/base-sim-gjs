import {
  ActiveMission,
  AvailableMission,
  CompletedMission,
  GameState,
  SoldierId,
  SoldierState,
} from "./domain";

function setDuty(
  state: GameState,
  soldierIds: SoldierId[],
  duty: SoldierState["duty"],
): GameState {
  return {
    ...state,
    roster: state.roster.map((soldier) =>
      soldierIds.includes(soldier.id) ? { ...soldier, duty } : soldier,
    ),
  };
}

function availableToActive(
  state: GameState,
  availableMission: AvailableMission,
  assignedSoldierIds: SoldierId[],
): GameState {
  const active: ActiveMission = {
    _tag: "active",
    id: availableMission.id,
    name: availableMission.name,
    remaining: availableMission.duration,
    assigned: assignedSoldierIds,
  };
  const moved: GameState = {
    ...state,
    available: state.available.filter((mission) => mission.id !== availableMission.id),
    in_progress: [...state.in_progress, active],
  };
  return setDuty(moved, assignedSoldierIds, "active");
}

function ActiveToCompleted(
  state: GameState,
  activeMission: ActiveMission,
): GameState {
  const completed: CompletedMission = {
    id: activeMission.id,
    name: activeMission.name,
    _tag: "completed",
  };
  return {
    ...state,
    in_progress: state.in_progress.filter((mission) => mission.id !== activeMission.id),
    completed: [...state.completed, completed],
  };
}

function releaseSoldiers(state: GameState, soldierIds: SoldierId[]): GameState {
  return setDuty(state, soldierIds, "rest");
}

function finishMission(state: GameState, activeMission: ActiveMission): GameState {
  return releaseSoldiers(ActiveToCompleted(state, activeMission), activeMission.assigned);
}

export { availableToActive, ActiveToCompleted, releaseSoldiers, finishMission };
