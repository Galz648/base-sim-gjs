/**
 * Example property-based tests for GameState.
 *
 * Effect Arbitrary generates many well-formed states. Each test names an
 * invariant that must hold after `apply` — the sim's public step.
 *
 * Run: bun test tests
 *
 * Missing cases to write by hand: ./UNCOVERED.md
 */
import { describe, expect, test } from "bun:test";
import { Arbitrary, Effect } from "effect";
import type { Action, GameState } from "../src/lib/sim/domain";
import { apply } from "../src/lib/sim/sim";
import {
  acceptedAssign,
  rejectedAssign,
  tick,
  tickCase,
} from "./arbitrary/game-state";

describe("GameState properties", () => {
  check("tick advances the clock by exactly N hours, and hour stays in 0..23", tickCase, ({ state, hours }) => {
    const after = step(state, tick(hours)).state;
    return (
      totalHours(after) === totalHours(state) + hours &&
      after.hour >= 0 &&
      after.hour < 24
    );
  });

  check("tick never creates or destroys soldiers", tickCase, ({ state, hours }) => {
    const after = step(state, tick(hours)).state;
    return sameIds(rosterIds(state), rosterIds(after));
  });

  check("tick never loses a mission — they only move between buckets", tickCase, ({ state, hours }) => {
    const after = step(state, tick(hours)).state;
    return sameIds(missionKeys(state), missionKeys(after));
  });

  check("after a tick, every still-active mission has remaining > 0", tickCase, ({ state, hours }) => {
    const after = step(state, tick(hours)).state;
    return after.in_progress.every((mission) => mission.remaining > 0);
  });

  check("scheduled missions whose start time has arrived are no longer scheduled", tickCase, ({ state, hours }) => {
    const after = step(state, tick(hours)).state;
    const now = totalHours(after);
    return after.scheduled.every((mission) => totalHours(mission.startsAt) > now);
  });

  check("a rejected assignment leaves GameState unchanged", rejectedAssign, ({ state, action }) => {
    const result = step(state, action);
    return (
      result.outcomes.every((outcome) => outcome._tag.startsWith("outcome/assignment-rejected")) &&
      structurallyEqual(result.state, state)
    );
  });

  check("an accepted assignment deploys the named soldiers and leaves the clock alone", acceptedAssign, ({ state, action }) => {
    const result = step(state, action);
    const after = result.state;
    const accepted = result.outcomes.some((outcome) => outcome._tag === "outcome/assignment-accepted");
    const deployed = action.soldierIds.every((id) =>
      after.roster.some((soldier) => soldier.id === id && soldier.duty === "active"),
    );
    const leftAvailable = after.available.every((mission) => mission.id !== action.missionId);
    const nowActive = after.in_progress.some(
      (mission) =>
        mission.id === action.missionId &&
        action.soldierIds.every((id) => mission.assigned.includes(id)),
    );
    return (
      accepted &&
      deployed &&
      leftAvailable &&
      nowActive &&
      after.day === state.day &&
      after.hour === state.hour &&
      sameIds(rosterIds(state), rosterIds(after))
    );
  });
});

function check<A>(
  name: string,
  arbitrary: Arbitrary.Arbitrary<A>,
  property: (value: A) => boolean,
): void {
  test(name, () => {
    const result = Effect.runSync(
      Arbitrary.checkEffect(arbitrary, property, { runs: 100, seed: 1 }),
    );
    if (result._tag !== "Passed") {
      throw new Error(Arbitrary.formatCheckFailure(result) ?? result._tag);
    }
    expect(result.runs).toBe(100);
  });
}

function step(state: GameState, action: Action) {
  return Effect.runSync(apply(state, action));
}

function totalHours(time: { day: number; hour: number }): number {
  return time.day * 24 + time.hour;
}

function rosterIds(state: GameState): number[] {
  return [...state.roster.map((soldier) => soldier.id)].sort((a, b) => a - b);
}

function missionKeys(state: GameState): string[] {
  return [
    ...state.scheduled.map((mission) => `${mission.id}:${mission.name}`),
    ...state.available.map((mission) => `${mission.id}:${mission.name}`),
    ...state.in_progress.map((mission) => `${mission.id}:${mission.name}`),
    ...state.completed.map((mission) => `${mission.id}:${mission.name}`),
  ].sort();
}

function sameIds<T>(left: T[], right: T[]): boolean {
  return left.length === right.length && left.every((value, i) => value === right[i]);
}

function structurallyEqual(left: GameState, right: GameState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
