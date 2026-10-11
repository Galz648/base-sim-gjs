import { GameState, SoldierId, MissionId } from "./domain";
import { isDeployable, legalActions } from "./legal";

// Semantic status of a roster unit. Words and colors are the driver's business; the rules live here.
// TODO: determine if this doesn't conflict with simulation code
export type UnitStatus = "deployable" | "busy" | "injured" | "unfit";

export function unitStatus(state: GameState, id: SoldierId): UnitStatus {
  const unit = state.roster.find((s) => s.id === id);
  if (!unit) return "unfit";
  if (isDeployable(unit)) return "deployable";
  if (state.in_progress.some((m) => m.assigned.includes(id))) return "busy";
  return unit.condition === "injured" ? "injured" : "unfit";
}

// True when the sim would accept some Assign for this mission right now. Derived from legalActions,
// so it can never disagree with what the driver is offered.
export function canDispatch(state: GameState, missionId: MissionId): boolean {
  return legalActions(state).some((a) => a.type === "Assign" && a.missionId === missionId);
}

export type CallStatus = "waiting" | "active" | "done";
export type CallRow = { id: MissionId; name: string; status: CallStatus };

// Every call the player can see, in display order: waiting, then active, then done.
export function callBoard(state: GameState): CallRow[] {
  return [
    ...state.available.map((m): CallRow => ({ id: m.id, name: m.name, status: "waiting" })),
    ...state.in_progress.map((m): CallRow => ({ id: m.id, name: m.name, status: "active" })),
    ...state.completed.map((m): CallRow => ({ id: m.id, name: m.name, status: "done" })),
  ];
}
