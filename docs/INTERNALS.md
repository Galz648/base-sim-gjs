### Sim Loop

Two `setInterval`s in `Sim.start` (Bun, `CONFIG.TICK_DURATION`):

1. Hour tick — `HourElapsed` increments hour/day and decrements `in_progress.remaining`.
2. Completion sweep — missions with `remaining === 0` dispatch `MissionCompleted`.

Each dispatch calls `apply` → `step` (reducer) → `logTransition` (Bun console).

`setInterval` still lives inside `Sim`. A timer port is planned; not wired.

### Store

- **Store** — holds `GameState`.
- **Dispatch** — `apply`s one event now. `events` is unused; no queue yet.
- **Reducer** — `step` is meant to be pure. It still `throw`s on some bad assignments.

### State

`GameState`: `day`, `hour`, `roster`, `missions` (available), `in_progress`, `completed`.

Soldier: `duty` (`active` | `rest`) and `condition` (`fit` | `injured`). Stamina drain/recover is not in the Bun `step` hour path right now (Godot `src/scripts/sim.ts` still drains).

### Missions

| Bucket        | Type               | Crew                     |
| ------------- | ------------------ | ------------------------ |
| `missions`    | `Mission`          | none                     |
| `in_progress` | `ActiveMission`    | `assigned` + `remaining` |
| `completed`   | `CompletedMission` | none                     |

`availableToActive(mission, soldierIds)` copies an available mission into `in_progress`.

### Events

| Event                    | What `step` does                                         |
| ------------------------ | -------------------------------------------------------- |
| `HourElapsed`            | Clock + countdown                                        |
| `MissionAssignmentEvent` | Headcount check, crew `active`, move to `in_progress`    |
| `MissionCompleted`       | Drop from `in_progress`, append `completed`, crew `rest` |

`src/bun/entrypoint.ts` only calls `sim.start()`. It does not dispatch an assignment.

### Mission checklist

#### Done

- [x] **Assignment (event).** `MissionAssignmentEvent` in `step`: find available mission, check headcount, `availableToActive`, mark those soldiers `active`, move to `in_progress` with `remaining` from `duration`. No pause, no UI.
- [x] Available missions hold no crew. `assigned` lives on `ActiveMission` only.
- [x] `availableToActive(mission, soldierIds)`.
- [x] **Complete.** `MissionCompleted` drops `in_progress`, appends `completed`, sets assigned crew to `rest`.
- [x] Mission board in the Bun tick log: available / active / completed. Fixed left-column width.
- [x] `CONFIG.TICK_DURATION` drives both `setInterval`s.
- [x] Exhaustive `if`s in `step`.

#### Not done

- [ ] **`assign` helper.** No `assign(state, missionId, soldierIds)`. Assignment is only the event reducer.
- [ ] **Call from Bun.** Dispatch a `MissionAssignmentEvent` from `src/bun/entrypoint.ts`.
- [ ] **Verify.** Run the Bun loop: assignment arrives, soldiers go busy, remaining counts down, mission completes, soldiers free.
- [ ] **Assignment guards.** Reject ids not on the roster, soldiers who are not `rest`/`fit`, soldiers already on an `in_progress` mission.
- [ ] **Pure reducer.** `step` still `throw`s on missing mission / short headcount.
- [ ] **Timer driver.** Move `setInterval` behind a driver that only calls `onTick`. Bun supplies `setInterval`; Godot `Timer` later. Keep both intervals.
