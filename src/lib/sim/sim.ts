import { Effect, Match, Result } from "effect";
import { CONFIG } from "./config";
import {
  GameState,
  GameEvent,
  HourElapsedEvent,
  ActiveMission,
  AvailableMission,
  CompletedMissionEvent,
  MissionAssignmentEvent,
  SoldierId,
  Time,
  ScheduledMission,
  ScheduledMissionEvent,
  Outcome,
  Action,
} from "./domain";
import {
  ActiveToCompleted,
  availableToActive,
  finishMission,
  releaseSoldiers,
  soldiersAlreadyDeployed,
  soldiersNotReady,
  tickMissions,
  unknownSoldiers,
  ScheduledToAvailable,
} from "./transform";
import { Store } from "./store";
import { logStepSuccess } from "./utils";
import { SoldiersNotReady, SoldiersAlreadyDeployed, InsufficientHeadcount } from "./assignment";
import { MissionNotFound, UnknownSoldiers } from "./error";
import { tryAssign } from "./mission";


type StepOutcome = { outcomes: Outcome[], state: GameState }
function getCompletedMissions(state: GameState): CompletedMissionEvent[]{
  const freshly_completed = 
  state.in_progress.filter((active: ActiveMission) => active.remaining === 0);
const completed_missions_events: CompletedMissionEvent[] = freshly_completed.map(
  (mission: ActiveMission): CompletedMissionEvent => {
    return {
      _tag: "event/completed-mission",
      type: "MissionCompleted",
      mission_id: mission.id,
      name: mission.name,
    };
  },
);

return completed_missions_events
}
function isReady(scheduled: ScheduledMission[], t: Time): ScheduledMission[] { //TODO: change name
  const now = t.day * 24 + t.hour;
  return scheduled.filter((m) => m.startsAt.day * 24 + m.startsAt.hour <= now);
}


function apply(state: GameState, action: Action): Effect.Effect<StepOutcome, StepError> {
  if (action.type === "Tick") {
    return Effect.succeed(onTick(state, action.hours));
  }

  if (action.type === "Assign") {

    const assignment_result = tryAssign(action, state);
    const assignment_outcome = Result.match(assignment_result, {
      onSuccess: (accepted): StepOutcome => ({
        state: accepted.state,
        outcomes: [accepted],
      }),
      onFailure: (rejected): StepOutcome => ({
        state: rejected.state,
        outcomes: [rejected],
      }),
    });
    return Effect.succeed(assignment_outcome);

  }

  const _exhaustive: never = action;
  return _exhaustive;
}

function incrementTime(time: Time): Time {
  const increment = (x: number) => x + 1;
  const total_time = increment(time.hour) + time.day * 24;
  const hour = total_time % 24;
  const day = Math.floor(total_time / 24);

  return {
    hour,
    day,
  };
}



type StepError =
  | MissionNotFound
  | UnknownSoldiers

type StepOk = { ok: true; result: StepOutcome }
type StepFail = { ok: false; state: GameState; error: StepError }
type StepResult = StepOk | StepFail
const findAvailableMission = (
  state: GameState,
  missionId: number,
): Effect.Effect<AvailableMission, MissionNotFound> => {
  const mission = state.available.find((m) => m.id === missionId);
  return mission
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "Error/MissionNotFound", missionId });
};

const findActiveMission = (
  state: GameState,
  missionId: number,
): Effect.Effect<ActiveMission, MissionNotFound> => {
  const mission = state.in_progress.find((m) => m.id === missionId);
  return mission
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "Error/MissionNotFound", missionId });
};

const checkKnownSoldiers = (
  state: GameState,
  mission: AvailableMission,
  soldierIds: SoldierId[],
): Effect.Effect<AvailableMission, UnknownSoldiers> => {
  const ghosts = unknownSoldiers(state, soldierIds);
  return ghosts.length === 0
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "Error/UnknownSoldiers", missionId: mission.id, soldierIds: ghosts });
};

const checkSoldiersReady = (
  state: GameState,
  mission: AvailableMission,
  soldierIds: SoldierId[],
): Effect.Effect<AvailableMission, SoldiersNotReady> => {
  const notReady = soldiersNotReady(state, soldierIds);
  return notReady.length === 0
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "SoldiersNotReady", missionId: mission.id, soldierIds: notReady });
};

const checkNotDeployed = (
  state: GameState,
  mission: AvailableMission,
  soldierIds: SoldierId[],
): Effect.Effect<AvailableMission, SoldiersAlreadyDeployed> => {
  const alreadyAssigned = soldiersAlreadyDeployed(state, soldierIds);
  return alreadyAssigned.length === 0
    ? Effect.succeed(mission)
    : Effect.fail({
      _tag: "SoldiersAlreadyDeployed",
      missionId: mission.id,
      soldierIds: alreadyAssigned,
    });
};

const checkHeadcount = (
  mission: AvailableMission,
  soldierIds: SoldierId[],
  rosterSize: number,
): Effect.Effect<AvailableMission, InsufficientHeadcount> =>
  soldierIds.length < mission.requiredSolders
    ? Effect.fail({
      _tag: "InsufficientHeadcount",
      missionId: mission.id,
      expected: mission.requiredSolders,
      got: rosterSize,
    })
    : Effect.succeed(mission);

// const assignSoldiers = (
//   state: GameState,
//   event: MissionAssignmentEvent,
// ): Effect.Effect<StepResult, StepError> =>
//   Effect.flatMap(findAvailableMission(state, event.mission_id), (mission) =>
//     Effect.flatMap(checkKnownSoldiers(state, mission, event.soldier_ids), (known) =>
//       // Effect.flatMap(checkSoldiersReady(state, known, event.soldier_ids), (ready) =>
//         // Effect.flatMap(checkNotDeployed(state, ready, event.soldier_ids), (free) =>
//           Effect.flatMap(checkHeadcount(free, event.soldier_ids, state.roster.length), (cleared) =>
//             Effect.succeed(availableToActive(state, cleared, event.soldier_ids)),
//           ),
//         ),
//       ),
  

// TODO: handle injury on return — duty goes to rest even if condition changes
const completeMission = (
  state: GameState,
  event: CompletedMissionEvent,
): Effect.Effect<GameState, MissionNotFound> =>
  Effect.flatMap(findActiveMission(state, event.mission_id), (mission) =>
    Effect.succeed(finishMission(state, mission)),
  );

export const reportStepError = (error: StepError): void => {
  Match.value(error).pipe(
    Match.tag("Error/MissionNotFound", (e) => {
      console.log(`Mission with id ${e.missionId} not found.`);
    }),
    Match.tag("Error/UnknownSoldiers", (e) => {
      console.log(
        `Unable to assign to mission with id: ${e.missionId} - unknown soldiers: ${e.soldierIds.join(", ")}`,
      );
    }),
    // Match.tag("SoldiersNotReady", (e) => {
    //   console.log(
    //     `Unable to assign to mission with id: ${e.missionId} - soldiers not rest/fit: ${e.soldierIds.join(", ")}`,
    //   );
    // }),
    // Match.tag("SoldiersAlreadyDeployed", (e) => {
    //   console.log(
    //     `Unable to assign to mission with id: ${e.missionId} - soldiers already on a mission: ${e.soldierIds.join(", ")}`,
    //   );
    // }),
    // Match.tag("InsufficientHeadcount", (e) => {
    //   console.log(
    //     `Unable to assign to mission with id: ${e.missionId} - not enough headcount. \n\t expected: ${e.expected}, got: \n ${e.got}`,
    //   );
    // }),
    Match.exhaustive,
  );
};
function closeFinishedMissions(state: GameState, outcomes: Outcome[]): GameState {
  const finished = state.in_progress.filter((mission) => mission.remaining <= 0);
  return finished.reduce((current, mission) => {
    outcomes.push({ // TODO: return this 
      _tag: "outcome/mission-completed",
      type: "MissionCompleted",
      missionId: mission.id,
      soldierIds: mission.assigned.map(Number),
    });
    
    return releaseSoldiers(ActiveToCompleted(current, mission), mission.assigned);
  }, state);
}

function openScheduledMissions(state: GameState, outcomes: Outcome[]): GameState {
  const ready = isReady(state.scheduled, { day: state.day, hour: state.hour });
  const readyIds = new Set(ready.map((mission) => mission.id));
  for (const mission of ready) {
    outcomes.push({ // TODO: return the outcomes
      _tag: "outcome/mission-available",
      type: "MissionAvailable",
      missionId: mission.id,
    });
  }
  return {
    ...state,
    scheduled: state.scheduled.filter((mission) => !readyIds.has(mission.id)),
    available: [...state.available, ...ready.map(ScheduledToAvailable)],
  };
}

function onTick(state: GameState, hours: number): StepOutcome {
  const outcomes: Outcome[] = [];
  let next = state;
  for (let step = 0; step < hours; step++) {
    const time = incrementTime({ day: next.day, hour: next.hour });
    next = tickMissions({ ...next, day: time.day, hour: time.hour });
    next = closeFinishedMissions(next, outcomes);
    next = openScheduledMissions(next, outcomes);
  }
  return { state: next, outcomes };
}
class Sim {
  store: Store;

  constructor(store: Store) {
    this.store = store;
  }






  start(tickMs: number = CONFIG.TICK_DURATION): void {
    //TODO: choose if the tick should happen before the other events
    // TODO(s1): the order today is in onTick (time, missions tick, finished close, scheduled open). Keep
    // it, confirm it by watching the bun run, and replace the TODO above with one line stating the order.

    // assign listener

    /// type Listener = (state:GameState, outcomes: Outcome[]) => void;
    this.store.subscribe((result: StepResult) => {
      if (result.ok) {
        logStepSuccess(result.result.state, result.result.outcomes);
        return;
      }
      reportStepError(result.error);
    });
    setInterval(() => {
    // move time
    this.store.dispatch({
      _tag: "action/tick",
      type: "Tick",
      hours: 1
    })

    }, tickMs);

  }
}





export { Sim, type Store, apply, StepError, StepOk, StepFail, StepOutcome, StepResult}
