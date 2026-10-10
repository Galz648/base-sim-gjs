import { Arbitrary, Schema } from "effect";
import type {
  Action,
  AliveSoldierState,
  AssignmentAction,
  AvailableMission,
  GameState,
} from "../../src/lib/sim/domain";

const SOLDIER_NAMES = ["Gal", "Nir", "Dan", "Noa"] as const;
const MISSION_NAMES = [
  "Recon Patrol",
  "Supply Run",
  "Bathroom Cleaning",
  "Guard Duty",
] as const;

const nat = (min: number, max: number) =>
  Schema.Int.check(
    Schema.isGreaterThanOrEqualTo(min),
    Schema.isLessThanOrEqualTo(max),
  );

const natArb = (min: number, max: number) => Arbitrary.schema(nat(min, max));

const BUCKETS = [
  "scheduled",
  "available",
  "in_progress",
  "completed",
] as const;

type Bucket = (typeof BUCKETS)[number];

type MissionBits = {
  id: number;
  name: string;
  duration: number;
  requiredSolders: number;
  remaining: number;
  bucket: Bucket;
  startOffset: number;
};

/**
 * Well-formed GameState: unique ids, assigned soldiers exist on the roster,
 * and anyone on an active mission is marked duty "active".
 */
export const gameState: Arbitrary.Arbitrary<GameState> = Arbitrary.flatMap(
  Arbitrary.all({
    day: natArb(1, 8),
    hour: natArb(0, 23),
    soldierCount: natArb(1, 4),
    missionCount: natArb(1, 4),
  }),
  ({ day, hour, soldierCount, missionCount }) =>
    Arbitrary.map(
      Arbitrary.all({
        soldiers: soldierFields(soldierCount),
        missions: missionFields(missionCount, soldierCount),
      }),
      ({ soldiers, missions }) => assemble({ day, hour, soldiers, missions }),
    ),
);

export const tickHours: Arbitrary.Arbitrary<number> = natArb(1, 24);

export const tickCase: Arbitrary.Arbitrary<{ state: GameState; hours: number }> =
  Arbitrary.all({ state: gameState, hours: tickHours });

export const rejectedAssign: Arbitrary.Arbitrary<{
  state: GameState;
  action: AssignmentAction;
}> = Arbitrary.map(gameState, (state) => ({
  state,
  action: ghostMissionAssign(state),
}));

export const acceptedAssign: Arbitrary.Arbitrary<{
  state: GameState;
  action: AssignmentAction;
}> = Arbitrary.map(gameState, withAssignableMission);

function soldierFields(
  count: number,
): Arbitrary.Arbitrary<Omit<AliveSoldierState, "duty" | "_tag" | "id" | "name">[]> {
  return Arbitrary.all(
    Array.from({ length: count }, () =>
      Arbitrary.all({
        health: natArb(1, 100),
        stamina: natArb(0, 100),
        condition: Arbitrary.schema(Schema.Literals(["fit", "injured"])),
      }),
    ),
  );
}

function missionFields(
  count: number,
  soldierCount: number,
): Arbitrary.Arbitrary<MissionBits[]> {
  return Arbitrary.all(
    Array.from({ length: count }, (_, i) =>
      Arbitrary.map(
        Arbitrary.all({
          duration: natArb(1, 8),
          requiredSolders: natArb(1, soldierCount),
          remaining: natArb(1, 8),
          bucket: Arbitrary.schema(Schema.Literals(BUCKETS)),
          startOffset: natArb(-6, 12),
        }),
        (fields) => ({
          id: i + 1,
          name: MISSION_NAMES[i] ?? `Mission ${i + 1}`,
          ...fields,
        }),
      ),
    ),
  );
}

function assemble(input: {
  day: number;
  hour: number;
  soldiers: Omit<AliveSoldierState, "duty" | "_tag" | "id" | "name">[];
  missions: MissionBits[];
}): GameState {
  const roster: AliveSoldierState[] = input.soldiers.map((stats, i) => ({
    _tag: "soldier/alive",
    id: i + 1,
    name: SOLDIER_NAMES[i] ?? `S${i + 1}`,
    duty: "rest",
    ...stats,
  }));

  const deployed = new Set<number>();
  const state: GameState = {
    day: input.day,
    hour: input.hour,
    roster,
    scheduled: [],
    available: [],
    in_progress: [],
    completed: [],
  };

  for (const mission of input.missions) {
    if (mission.bucket === "scheduled") {
      const start = input.day * 24 + input.hour + mission.startOffset;
      const startDay = Math.floor(start / 24);
      const startHour = ((start % 24) + 24) % 24;
      state.scheduled.push({
        _tag: "mission/scheduled",
        id: mission.id,
        name: mission.name,
        duration: mission.duration,
        requiredSolders: mission.requiredSolders,
        startsAt: { day: startDay, hour: startHour },
      });
      continue;
    }

    if (mission.bucket === "available") {
      state.available.push({
        _tag: "mission/available",
        id: mission.id,
        name: mission.name,
        duration: mission.duration,
        requiredSolders: mission.requiredSolders,
      });
      continue;
    }

    if (mission.bucket === "in_progress") {
      const take = roster
        .filter((soldier) => !deployed.has(soldier.id))
        .slice(0, mission.requiredSolders);
      for (const soldier of take) deployed.add(soldier.id);
      state.in_progress.push({
        _tag: "mission/active",
        id: mission.id,
        name: mission.name,
        remaining: mission.remaining,
        assigned: take.map((soldier) => soldier.id),
      });
      continue;
    }

    state.completed.push({
      _tag: "mission/completed",
      id: mission.id,
      name: mission.name,
    });
  }

  return {
    ...state,
    roster: roster.map((soldier) =>
      deployed.has(soldier.id) ? { ...soldier, duty: "active" } : soldier,
    ),
  };
}

function missionIds(state: GameState): Set<number> {
  return new Set([
    ...state.scheduled.map((mission) => mission.id),
    ...state.available.map((mission) => mission.id),
    ...state.in_progress.map((mission) => mission.id),
    ...state.completed.map((mission) => mission.id),
  ]);
}

function ghostMissionAssign(state: GameState): AssignmentAction {
  const used = missionIds(state);
  let missionId = 1000;
  while (used.has(missionId)) missionId += 1;
  return {
    _tag: "action/assign",
    type: "Assign",
    missionId,
    soldierIds: state.roster.slice(0, 1).map((soldier) => soldier.id),
  };
}

function withAssignableMission(state: GameState): {
  state: GameState;
  action: AssignmentAction;
} {
  const resting = state.roster.filter((soldier) => soldier.duty === "rest");
  const ready = state.available.find(
    (mission) => mission.requiredSolders <= resting.length,
  );
  if (ready) {
    return {
      state,
      action: assign(ready.id, resting.slice(0, ready.requiredSolders)),
    };
  }

  const missionId = Math.max(0, ...missionIds(state)) + 1;
  const soldierId = Math.max(0, ...state.roster.map((soldier) => soldier.id)) + 1;
  const reserve: AliveSoldierState = {
    _tag: "soldier/alive",
    id: soldierId,
    name: "Reserve",
    health: 100,
    stamina: 100,
    duty: "rest",
    condition: "fit",
  };
  const mission: AvailableMission = {
    _tag: "mission/available",
    id: missionId,
    name: "Reserve Duty",
    duration: 3,
    requiredSolders: 1,
  };
  return {
    state: {
      ...state,
      roster: [...state.roster, reserve],
      available: [...state.available, mission],
    },
    action: assign(missionId, [reserve]),
  };
}

function assign(
  missionId: number,
  soldiers: { id: number }[],
): AssignmentAction {
  return {
    _tag: "action/assign",
    type: "Assign",
    missionId,
    soldierIds: soldiers.map((soldier) => soldier.id),
  };
}

export function tick(hours: number): Action {
  return { _tag: "action/tick", type: "Tick", hours };
}
