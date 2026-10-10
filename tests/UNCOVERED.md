# Uncovered GameState properties

Write these by hand. Reuse `check`, `step`, `tick`, and `gameState` from the existing files.

Seam: `apply(state, action)` → `{ state, outcomes }`.

Already covered: clock wrap, roster/mission conservation on tick, active `remaining > 0`, due scheduled leave `scheduled`, ghost-id reject is identity, constructed accept deploys named soldiers.

Generators in `arbitrary/game-state.ts` only build well-formed worlds (unique mission ids, deployed soldiers are `active`). `rejectedAssign` is only a ghost mission id. `acceptedAssign` often injects a Reserve soldier + mission.

---

## Assign rejects

`tryAssign` has three rejection tags. Only the first is generated.

### `not-enough-soldiers`

Generate: a state with at least one `available` mission, then an Assign whose `soldierIds` (after filtering to the roster) are fewer than `requiredSolders`. Empty `soldierIds` is the smallest case.

Assert: outcome tag is `outcome/assignment-rejected/not-enough-soldiers`, state unchanged.

### `soldiers-not-resting`

Generate: a state with an available mission and at least one `duty: "active"` soldier (already on `in_progress`). Assign that soldier to the available mission, with enough ids to pass the headcount check.

Assert: tag is `outcome/assignment-rejected/soldiers-not-resting`, state unchanged.

### Mission exists but is not available

Generate: Assign using an id from `scheduled`, `in_progress`, or `completed` — not a fresh ghost id.

Assert: same tag as ghost reject (`mission-not-available`), state unchanged.

### Unknown soldier ids (known hole)

`tryAssign` filters to roster and drops ghosts. `[restingId, 99]` can accept if headcount is still met. There is no `soldiers-not-found` tag yet (TODO in `mission.ts`).

A property that “unknown ids always reject” will fail today. Write it only if you want a red test for that change.

---

## Assign accept (thinner than it looks)

Existing accept test checks deploy + clock. Still missing:

- Other `available` / `in_progress` / `completed` / `scheduled` rows stay put (same ids, same fields).
- Soldiers not in `soldierIds` keep their previous `duty`.
- New active mission has `remaining ===` the available mission’s `duration`.
- Extra soldiers over `requiredSolders`: current code deploys every roster match, not a prefix of size `requiredSolders`. Decide if that is the spec before writing the property.
- `condition: "injured"` is generated but `tryAssign` ignores it. `soldiersNotReady` in `transform.ts` cares about fit; assign does not. A “injured cannot deploy” property fails today.

---

## Tick details

Existing tick tests check clock, conservation, “no leftover remaining ≤ 0”, and “due scheduled are gone”. Still missing:

- For missions that stay `in_progress`, `remaining` drops by exactly `hours` (or hits 0 and leaves — don’t reimplement `onTick`; compare before/after per mission).
- A mission whose `remaining` is consumed lands in `completed` (not merely “id still exists”).
- Its `assigned` soldiers return to `duty: "rest"`.
- `outcomes` include `outcome/mission-completed` with those `soldierIds`, and `outcome/mission-available` for each scheduled row whose `startsAt` is now due.
- Scheduled rows that are still in the future stay in `scheduled` (unchanged `startsAt` / `duration` / `requiredSolders` / name).
- A scheduled row that opens keeps `duration`, `requiredSolders`, and name on the new `available` row.
- `tick(0)` is identity. Generator today only emits `hours` 1..24.
- Starting `remaining <= 0` on an active mission: generator never produces this. Close-on-first-tick is untested.

---

## Sequences (none exist)

Single `apply` only. Useful next cases:

- `tick(a)` then `tick(b)` equals one `tick(a + b)` (state, and ideally outcomes concatenated).
- Accept an assign, then tick `remaining` hours: that mission is `completed`, those soldiers are `rest`, clock advanced by `remaining`.
- Two assigns in a row. Same soldier on a second available mission must reject (`soldiers-not-resting`).
- Reject then tick: reject leaves state equal; tick then changes only time / missions.

---

## Generator blinds

If you want these, extend `gameState` (or add a second arbitrary). Do not assume the current one produces them.

- Duplicate mission ids across buckets (seed does this: available Recon and in-progress Supply Run both use id `1`).
- Empty roster or empty mission lists.
- `hours > 24` on one Tick.
- `DeadSoldierState` — not in `GameState.roster` today (`AliveSoldierState[]` only).

---

## Outside this seam (skip unless you change the seam)

`Store.dispatch`, listeners, `Sim.start`, `StepError` (`MissionNotFound`, `UnknownSoldiers`). `apply` never fails for Tick/Assign.

Health / stamina never change. No property would notice if they started to.

---

## Notes while writing

- Copy the `check(name, arbitrary, property)` helper. `{ runs: 100, seed: 1 }`.
- Build cases constructively (map/`flatMap` over `gameState`). Heavy `filter` burns `maxDiscards`.
- Integer ranges: `Schema.Int.check(isGreaterThanOrEqualTo, isLessThanOrEqualTo)`. `Schema.Finite.check(isInt)` throws in Effect 4.0.2.
- Do not mutate generated values.
- Expected values from the spec (literals, “state unchanged”, “this id is in `completed`”), not by copying `onTick` / `tryAssign`.
