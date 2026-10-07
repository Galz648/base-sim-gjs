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
} from "./domain";
import {
  availableToActive,
  finishMission,
  soldiersAlreadyDeployed,
  soldiersNotReady,
  tickMissions,
  unknownSoldiers,
} from "./transform";
import { logTransition } from "./utils";

type Store = {
  getState(): GameState;
  state: GameState;
  events: GameEvent[];
  dispatch(event: GameEvent): void;
  subscribe(cb: () => void): void;
};

type Time = { hour: number; day: number };

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

const reportStepError = (error: StepError): void => {
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

class Sim {
  store: Store;

  constructor() {
    this.store = {
      state: {
        roster: [
          {
            _tag: "soldier/alive",
            id: 2,
            name: "Gal",
            health: 100,
            stamina: 50,
            duty: "rest",
            condition: "fit",
          },
          {
            _tag: "soldier/alive",
            id: 1,
            name: "Nir",
            health: 100,
            stamina: 100,
            duty: "active",
            condition: "fit",
          },
        ],
        day: 1,
        available: [
          {
            id: 1,
            duration: 6,
            name: "Recon Patrol",
            requiredSolders: 1,
            _tag: "mission/available",
          },
        ],
        hour: 1,
        in_progress: [
          {
            id: 1,
            remaining: 6,
            assigned: [1],
            name: "Supply Run",
            _tag: "mission/active",
          },
        ],
        completed: [],
      },
      events: [],
      dispatch: (event: GameEvent): void => {
        // this.store.events.push_front(event)
        const state = this.store.state;
        const next = Effect.runSync(
          Effect.match(this.apply(state, event), {
            onFailure: (error) => {
              reportStepError(error);
              return state;
            },
            onSuccess: (updated) => updated,
          }),
        );
        // TODO: This will not work under godot probably - move this somewhere else, possibly entrypoint.ts
        logTransition(state, event, next);
        this.store.state = next;
      },
      subscribe: function (cb: () => void): void {
        cb();
      },
      getState: function (): GameState {
        return this.state;
      },
    };
  }

  tick(): HourElapsedEvent {
    console.log(`tick`);
    return {
      type: "HourElapsed",
    };
  }

  private incrementTime(time: Time): Time {
    const increment = (x: number) => x + 1;
    const total_time = increment(time.hour) + time.day * 24;
    const hour = total_time % 24;
    const day = Math.floor(total_time / 24);

    return {
      hour,
      day,
    };
  }

  apply(state: GameState, event: GameEvent): Effect.Effect<GameState, StepError> {
    // Pure function
    return this.step(state, event);
  }

  private step(state: GameState, event: GameEvent): Effect.Effect<GameState, StepError> {
    if (event.type === "HourElapsed") {
      const time = this.incrementTime({
        day: state.day,
        hour: state.hour,
      });

      return Effect.succeed({
        ...tickMissions(state),
        ...time,
      });
    }

    if (event.type === "MissionCompleted") {
      return completeMission(state, event);
    }

    if (event.type === "MissionAssignmentEvent") {
      return assignSoldiers(state, event);
    }

    const _exhaustive: never = event;
    return _exhaustive;
  }

  start(tickMs: number = CONFIG.TICK_DURATION): void {
    // TODO: this should be runtime agnostic, so it fits in GODOT (so no SetInterval, should probably be wrapped in some Timer construct, to mimic Godot roughly)
    setInterval(() => {
      //TODO: choose if the tick should happen before the other events
      const event = this.tick();
      this.store.dispatch(event);
    }, tickMs);

    setInterval(() => {
      const freshly_completed = this.store
        .getState()
        .in_progress.filter((active: ActiveMission) => active.remaining === 0);
      const completed_missions_events = freshly_completed.map(
        (mission: ActiveMission): CompletedMissionEvent => {
          return {
            type: "MissionCompleted",
            mission_id: mission.id,
            name: mission.name,
          };
        },
      );
      completed_missions_events.forEach((e: CompletedMissionEvent) =>
        this.store.dispatch(e),
      );
    }, tickMs);
  }
}

export { Sim };
