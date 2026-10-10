import { Result } from "effect";
import { Action, AliveSoldierState, AssignmentAction, AvailableMission, GameState, Outcome } from "./domain";


/* 
type MissionAssignmentEvent = {
  _tag: "event/mission-assignment"
  type: "MissionAssignmentEvent";
  mission_id: AvailableMission["id"];
  soldier_ids: SoldierId[];
*/

type AssignmentAccepted = { _tag: "outcome/assignment-accepted", state: GameState }
type AssignmentRejected = { _tag: "outcome/assignment-rejected", state: GameState, reason: string } // TODO: change reason `string` to a typed union

function meetsRequirements(mission: AvailableMission, soldiers: AliveSoldierState[]): boolean {
    const enough_headcount = (mission.requiredSolders <= soldiers.length)
    const all_soldiers_not_deployed = soldiers.every((s) => s.duty == "rest")
    return enough_headcount && all_soldiers_not_deployed;
}
function tryAssign(assignment_action: AssignmentAction, state: GameState): Result.Result<AssignmentAccepted, AssignmentRejected> {
    // check that the mission id is a an available mission
    const mission = state.available.find((m: AvailableMission): boolean => {
        return m.id === assignment_action.missionId
    })

    if (!mission) {
        return Result.fail({ _tag: "outcome/assignment-rejected", state: state, reason: `mission with id: ${assignment_action.missionId} is not available` })
    }

    // check the requirements of the mission against the soldiers
    const soldiers = state.roster.filter(s => assignment_action.soldierIds.includes(s.id))
    if (!meetsRequirements(mission, soldiers)) {
        return Result.fail({ _tag: "outcome/assignment-rejected", state, reason: "requirements not met" })
    }

    return Result.succeed({ _tag: "outcome/assignment-accepted", state })
}

export { tryAssign, AssignmentAccepted, AssignmentRejected}
