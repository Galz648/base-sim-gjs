import { CONFIG } from "./config";
import {
  GameState,
  GameEvent,
  SoldierState,
  HourElapsedEvent,
  ActiveMission,
  CompletedMissionEvent,
  Mission,
  availableToActive,
} from "./domain";
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
        missions: [
          {
            id: 1,
            duration: 6,
            name: "Recon Patrol",
            requiredSolders: 1,
            status: "available",
          },
        ],
        hour: 1,
        in_progress: [
          // {
          //   id: 2,
          //   remaining: 4,
          //   assigned: [1],
          //   name: "Night Watch",
          // },
        ],
        completed: [{ id: 3, name: "Supply Run" }],
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
        ...state,
        ...time,
        in_progress: state.in_progress.map((mission: ActiveMission) => ({
          ...mission,
          remaining: mission.remaining - 1,
        })),
      };
    }

    if (event.type === "MissionCompleted") {
      const mission = state.in_progress.find((m) => m.id === event.mission_id);

      if (!mission) {
        throw new Error(`Mission with id ${event.mission_id} not found.`); // TODO: handle this differently, pure function should not cause side effects
      }

      const updated_roster = state.roster.map(
        (s: SoldierState): SoldierState => {
          if (mission.assigned.includes(s.id)) {
            // TODO: handle the case of injury on a task - note that it might not be assigned at this point
            return { ...s, duty: "rest" }; // this will probably cause problems if one soldier returns injured from a task. status could be changed to "deployed" | "free", to avoid this.
          }
          return s;
        }
      );
      return {
        ...state,
        roster: updated_roster,
        in_progress: state.in_progress.filter((m) => m.id !== event.mission_id),
        completed: [
          ...state.completed,
          { id: event.mission_id, name: event.name },
        ],
      };
    }

    if (event.type === "MissionAssignmentEvent") {
      // determine if what was passed in the assignment, satifies the requirements of the mission.
      const mission = state.missions.find((m) => m.id === event.mission_id);

      if (!mission) {
        throw new Error(`Mission with id ${event.mission_id} not found.`); // TODO: handle differently, pure function should not cause side effects
      }

      const requirements = {
        head_count: mission.requiredSolders,
      };

      // reasons for an assignment to fail
      // TODO: reject ids not on roster (ghosts)
      // TODO: reject soldiers who are not rest/fit
      // TODO: reject soldiers already on an in_progress mission

      if (event.soldier_ids.length < requirements.head_count) {
        throw new Error(
          `Unable to assign to mission with id: ${mission.id} - not enough headcount. \n\t expected: ${requirements.head_count}, got: \n ${state.roster.length}`
        );
      }
      // remove mission from available missions
      const new_missions = state.missions.filter(
        (m: Mission) => m.id !== mission.id
      ); // remove mission
      // move to mission in progress
      const new_in_progress: ActiveMission[] = [
        ...state.in_progress,
        availableToActive(mission, event.soldier_ids),
      ];
      // // find soldiers
      const new_roster = state.roster.map((s: SoldierState): SoldierState => ({
        ...s,
        duty: event.soldier_ids.includes(s.id) ? "active" : s.duty,
      }));

      return {
        ...state,
        missions: new_missions,
        roster: new_roster,
        in_progress: new_in_progress,
      };
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
