// The public surface of the sim. Anything outside the sim (TUI, bots, tests of drivers) imports from here
// and from nowhere else in src/lib/sim. Enforced by tools/check-tui-boundary.ts in the pre-commit hook.
// `step` is the sim's Effect, not a result: the driver runs it at its own edge (and supplies any services).
export { apply as step } from "./sim";
export type { StepResult, StepOutcome, StepError } from "./sim";
export { legalActions } from "./legal";
export { unitStatus, canDispatch, callBoard } from "./queries";
export type { UnitStatus, CallStatus, CallRow } from "./queries";
export type {
  GameState,
  Action,
  AssignmentAction,
  Outcome,
  SoldierId,
  MissionId,
  ScheduledMission,
  AliveSoldierState,
  ActiveMission,
  AvailableMission,
} from "./domain";
