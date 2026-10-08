import { Effect, Match } from "effect";
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
  availableToActive,
  finishMission,
  soldiersAlreadyDeployed,
  soldiersNotReady,
  tickMissions,
  unknownSoldiers,
} from "./transform";
import { Store } from "./store";


type StepResult = { outcomes: Outcome[], state: GameState } // TODO: change name `Result` - not the result type !
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
  return scheduled.filter((m) => {
    return (m.startsAt.day <= t.day && m.startsAt.hour <= t.hour)
  })
}


function apply(state: GameState, action: Action): Effect.Effect<StepResult, StepError> {
  if (action.type === "Tick") {
    const time = incrementTime({
      day: state.day,
      hour: state.hour,
    });

    // return Effect.succeed({
    //   // ...tickMissions(state),
    //   // ...time,
    // });
    void time;
    return Effect.succeed(onTick(state, action.hours));
  }

  if (action.type === "Assign") {
    return Effect.succeed({ outcomes: [], state });
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
type MissionNotFound = {
  readonly _tag: "MissionNotFound";
  readonly missionId: number;
};

type UnknownSoldiers = {
  readonly _tag: "UnknownSoldiers";
  readonly missionId: number;
  readonly soldierIds: readonly SoldierId[];
};

type SoldiersNotReady = {
  readonly _tag: "SoldiersNotReady";
  readonly missionId: number;
  readonly soldierIds: readonly SoldierId[];
};

type SoldiersAlreadyDeployed = {
  readonly _tag: "SoldiersAlreadyDeployed";
  readonly missionId: number;
  readonly soldierIds: readonly SoldierId[];
};

type InsufficientHeadcount = {
  readonly _tag: "InsufficientHeadcount";
  readonly missionId: number;
  readonly expected: number;
  readonly got: number;
};

type StepError =
  | MissionNotFound
  | UnknownSoldiers
  | SoldiersNotReady
  | SoldiersAlreadyDeployed
  | InsufficientHeadcount;

const findAvailableMission = (
  state: GameState,
  missionId: number,
): Effect.Effect<AvailableMission, MissionNotFound> => {
  const mission = state.available.find((m) => m.id === missionId);
  return mission
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "MissionNotFound", missionId });
};

const findActiveMission = (
  state: GameState,
  missionId: number,
): Effect.Effect<ActiveMission, MissionNotFound> => {
  const mission = state.in_progress.find((m) => m.id === missionId);
  return mission
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "MissionNotFound", missionId });
};

const checkKnownSoldiers = (
  state: GameState,
  mission: AvailableMission,
  soldierIds: SoldierId[],
): Effect.Effect<AvailableMission, UnknownSoldiers> => {
  const ghosts = unknownSoldiers(state, soldierIds);
  return ghosts.length === 0
    ? Effect.succeed(mission)
    : Effect.fail({ _tag: "UnknownSoldiers", missionId: mission.id, soldierIds: ghosts });
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

const assignSoldiers = (
  state: GameState,
  event: MissionAssignmentEvent,
): Effect.Effect<GameState, StepError> =>
  Effect.flatMap(findAvailableMission(state, event.mission_id), (mission) =>
    Effect.flatMap(checkKnownSoldiers(state, mission, event.soldier_ids), (known) =>
      Effect.flatMap(checkSoldiersReady(state, known, event.soldier_ids), (ready) =>
        Effect.flatMap(checkNotDeployed(state, ready, event.soldier_ids), (free) =>
          Effect.flatMap(checkHeadcount(free, event.soldier_ids, state.roster.length), (cleared) =>
            Effect.succeed(availableToActive(state, cleared, event.soldier_ids)),
          ),
        ),
      ),
    ),
  );

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
    Match.tag("MissionNotFound", (e) => {
      console.log(`Mission with id ${e.missionId} not found.`);
    }),
    Match.tag("UnknownSoldiers", (e) => {
      console.log(
        `Unable to assign to mission with id: ${e.missionId} - unknown soldiers: ${e.soldierIds.join(", ")}`,
      );
    }),
    Match.tag("SoldiersNotReady", (e) => {
      console.log(
        `Unable to assign to mission with id: ${e.missionId} - soldiers not rest/fit: ${e.soldierIds.join(", ")}`,
      );
    }),
    Match.tag("SoldiersAlreadyDeployed", (e) => {
      console.log(
        `Unable to assign to mission with id: ${e.missionId} - soldiers already on a mission: ${e.soldierIds.join(", ")}`,
      );
    }),
    Match.tag("InsufficientHeadcount", (e) => {
      console.log(
        `Unable to assign to mission with id: ${e.missionId} - not enough headcount. \n\t expected: ${e.expected}, got: \n ${e.got}`,
      );
    }),
    Match.exhaustive,
  );
};
function onTick(s: GameState, hours: number) {
  const out: Outcome[] = [];
  // s = advanceClock(s, hours);
  // s = completeFinishedMissions(s, out);  // marks done + releases soldiers
  // s = openScheduledMissions(s, out);
  return { state: s, outcomes: out };
}
class Sim {
  store: Store;

  constructor(store: Store) {
    this.store = store;
  }






  start(tickMs: number = CONFIG.TICK_DURATION): void {
    //TODO: choose if the tick should happen before the other events
    setInterval(() => {
      onTick(this.store.getState(), 1)
    }, tickMs);

  }
}





export { Sim, type Store, apply, StepError}
