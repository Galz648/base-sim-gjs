import { Action, AliveSoldierState, GameState } from "./domain";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...rest] = items;
  return [
    ...combinations(rest, size - 1).map((tail) => [head, ...tail]),
    ...combinations(rest, size),
  ];
}

export const isDeployable = (s: AliveSoldierState): boolean =>
  s.duty === "rest" && s.condition === "fit";

// Every action the sim would accept from this state. Assign offers exactly `requiredSolders` ids,
// because tryAssign deploys every matched soldier.
export function legalActions(state: GameState): Action[] {
  const ready = state.roster.filter(isDeployable).map((s) => s.id);
  const assigns: Action[] = state.available.flatMap((mission) =>
    combinations(ready, mission.requiredSolders).map(
      (soldierIds): Action => ({
        _tag: "action/assign",
        type: "Assign",
        missionId: mission.id,
        soldierIds,
      }),
    ),
  );
  return [...assigns, { _tag: "action/tick", type: "Tick", hours: 1 }];
}
