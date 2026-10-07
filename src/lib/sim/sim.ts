import { CONFIG } from "./config";
import {
  GameState,
  GameEvent,
  HourElapsedEvent,
  ActiveMission,
  CompletedMissionEvent,
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

class Sim {
  store: Store;

  constructor() {
    this.store = {
      state: {
        roster: [
          {
            id: 2,
            name: "Gal",
            health: 100,
            stamina: 50,
            duty: "rest",
            condition: "fit",
          },
          {
            id: 1,
            name: "Nir",
            health: 100,
            stamina: 100,
            duty: "rest",
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
            _tag: "available",
          },
        ],
        hour: 1,
        in_progress: [
        ],
        completed: [],
      },
      events: [],
      dispatch: (event: GameEvent): void => {
        // this.store.events.push_front(event)
        this.store.state = this.apply(this.store.state, event);
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

  apply(state: GameState, event: GameEvent): GameState {
    // Pure function
    const next = this.step(state, event);
    logTransition(state, event, next); // TODO: This will not work under godot probably - move this somewhere else, possibly entrypoint.ts
    return next;
  }

  private step(state: GameState, event: GameEvent): GameState {
    if (event.type === "HourElapsed") {
      const time = this.incrementTime({
        day: state.day,
        hour: state.hour,
      });

      return {
        ...tickMissions(state),
        ...time,
      };
    }

    if (event.type === "MissionCompleted") {
      const mission = state.in_progress.find((m) => m.id === event.mission_id);

      if (!mission) {
        throw new Error(`Mission with id ${event.mission_id} not found.`); // TODO: handle this differently, pure function should not cause side effects
      }

      // TODO: handle injury on return — duty goes to rest even if condition changes
      return finishMission(state, mission);
    }

    if (event.type === "MissionAssignmentEvent") {
      const mission = state.available.find((m) => m.id === event.mission_id);

      if (!mission) {
        throw new Error(`Mission with id ${event.mission_id} not found.`); // TODO: handle differently, pure function should not cause side effects
      }

      const requirements = {
        head_count: mission.requiredSolders,
      };

      const ghosts = unknownSoldiers(state, event.soldier_ids);
      if (ghosts.length > 0) {
        throw new Error(
          `Unable to assign to mission with id: ${mission.id} - unknown soldiers: ${ghosts.join(", ")}`
        );
      }

      const notReady = soldiersNotReady(state, event.soldier_ids);
      if (notReady.length > 0) {
        throw new Error(
          `Unable to assign to mission with id: ${mission.id} - soldiers not rest/fit: ${notReady.join(", ")}`
        );
      }

      const alreadyAssigned = soldiersAlreadyDeployed(state, event.soldier_ids);
      if (alreadyAssigned.length > 0) {
        throw new Error(
          `Unable to assign to mission with id: ${mission.id} - soldiers already on a mission: ${alreadyAssigned.join(", ")}`
        );
      }

      if (event.soldier_ids.length < requirements.head_count) {
        throw new Error(
          `Unable to assign to mission with id: ${mission.id} - not enough headcount. \n\t expected: ${requirements.head_count}, got: \n ${state.roster.length}`
        );
      }

      return availableToActive(state, mission, event.soldier_ids);
    }

    const _exhaustive: never = event;
    return state;
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
        }
      );
      completed_missions_events.forEach((e: CompletedMissionEvent) =>
        this.store.dispatch(e)
      );
    }, tickMs);
  }
}

export { Sim };
