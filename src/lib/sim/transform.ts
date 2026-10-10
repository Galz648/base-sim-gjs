import { Effect } from "effect";
import {
  ActiveMission,
  AvailableMission,
  CompletedMission,
  AliveSoldierState,
  GameState,
  SoldierId,
  ScheduledMission,
} from "./domain";
import { StepError } from "./sim";


function toAvailableMission(state: GameState, mission: ScheduledMission): Effect.Effect<GameState, StepError, never> {
  // TODO: validate it's actually time to make it available
  // move from scheduled to available
  const scheduled = state.scheduled.filter((item) => {
    item.id !== mission.id
  })
  const available: AvailableMission[] = [...state.available, ScheduledToAvailable(mission)]

  return Effect.succeed({ ...state, scheduled, available })
}


function ScheduledToAvailable(mission: ScheduledMission): AvailableMission {
  return {
    _tag: "mission/available",
    id: mission.id,
    duration: mission.duration,
    name: mission.name,
    requiredSolders: mission.requiredSolders
  }
}


function setDuty(
  state: GameState,
  soldierIds: SoldierId[],
  duty: AliveSoldierState["duty"],
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
    _tag: "mission/active",
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
    _tag: "mission/completed",
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

function tickMissions(state: GameState): GameState {
  return {
    ...state,
    in_progress: state.in_progress.map((mission) => ({
      ...mission,
      remaining: mission.remaining - 1,
    })),
  };
}

// const isOnDuty = (s: GameState, id: SoldierId) =>
//   s..some(m => m.status === "active" && m.assigned.includes(id));
function unknownSoldiers(state: GameState, soldierIds: SoldierId[]): SoldierId[] {
  const rosterIds = new Set(state.roster.map((soldier) => soldier.id));
  return soldierIds.filter((id) => !rosterIds.has(id));
}

function soldiersNotReady(state: GameState, soldierIds: SoldierId[]): SoldierId[] {
  const rosterById = new Map(state.roster.map((soldier) => [soldier.id, soldier]));
  return soldierIds.filter((id) => {
    const soldier = rosterById.get(id);
    return soldier !== undefined && (soldier.duty !== "rest" || soldier.condition !== "fit");
  });
}

function soldiersAlreadyDeployed(state: GameState, soldierIds: SoldierId[]): SoldierId[] {
  const deployed = new Set(state.in_progress.flatMap((active) => active.assigned));
  return soldierIds.filter((id) => deployed.has(id));
}

export {
  availableToActive,
  ActiveToCompleted,
  releaseSoldiers,
  finishMission,
  tickMissions,
  unknownSoldiers,
  soldiersNotReady,
  soldiersAlreadyDeployed,
  ScheduledToAvailable,
  toAvailableMission
};
