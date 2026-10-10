import { Result } from "effect";
import { Action, AliveSoldierState, AssignmentAcceptedOutcome, AssignmentAction, AssignmentRejectedOutcome, AvailableMission, GameState, Outcome } from "./domain";
import { availableToActive } from "./transform";

function meetsRequirements(mission: AvailableMission, soldiers: AliveSoldierState[]): boolean {
    const enough_headcount = (mission.requiredSolders <= soldiers.length)
    const all_soldiers_not_deployed = soldiers.every((s) => s.duty == "rest")
    return enough_headcount && all_soldiers_not_deployed;
}
function tryAssign(assignment_action: AssignmentAction, state: GameState): Result.Result<AssignmentAcceptedOutcome, AssignmentRejectedOutcome> {
    // check that the mission id is a an available mission
    const mission = state.available.find((m: AvailableMission): boolean => {
        return m.id === assignment_action.missionId
    })

    // check the requirements of the mission against the soldiers
    // TODO(s5): unhandled rejection reason: unknown soldier ids. The filter below silently drops ids that are
    // not in the roster, so [2, 99] passes the headcount check. Add a `soldiers-not-found` rejection
    // (soldiers.length !== assignment_action.soldierIds.length) before the headcount check.
    const soldiers =state.roster.filter(s => assignment_action.soldierIds.includes(s.id))
    if (!mission) {
        return Result.fail({
            _tag: "outcome/assignment-rejected/mission-not-available",
            state,
            missionId: assignment_action.missionId,
            soldierIds: assignment_action.soldierIds,
        })
    }
    if (soldiers.length < mission.requiredSolders) {
        return Result.fail({
            _tag: "outcome/assignment-rejected/not-enough-soldiers",
            state,
            missionId: assignment_action.missionId,
            soldierIds: assignment_action.soldierIds,
        })
    }
    if (!soldiers.every(s => s.duty === "rest")) {
        return Result.fail({
            _tag: "outcome/assignment-rejected/soldiers-not-resting",
            state,
            missionId: assignment_action.missionId,
            soldierIds: assignment_action.soldierIds,
        })
    }

      const new_state: GameState = availableToActive(state, mission, soldiers.map((s) => s.id)) 
      return Result.succeed({ _tag: "outcome/assignment-accepted", state: new_state, type: "AssignAccepted", soldierIds: assignment_action.soldierIds, missionId: assignment_action.missionId})
}

export { tryAssign}
