// Pure data + text. No layout, no Ink: everything the view reads about the game.
import { Action, GameState, Outcome } from "../src/lib/sim/domain";
import { isDeployable } from "../src/lib/sim/legal";

export type Pane = "actions" | "roster" | "calls";
export const PANES: Pane[] = ["roster", "calls", "actions"];
export type UiState = { focus: Pane; sel: Record<Pane, number>; inspecting: boolean };
export type Hit = { pane: Pane; index: number };
export type LogEntry = { day: number; hour: number; text: string; kind: "info" | "good" | "bad" };
export const LEFT_WIDTH = 66;

export const nameOf = (s: GameState, id: number) => s.roster.find((r) => r.id === id)?.name ?? `#${id}`;
const callName = (s: GameState, id: number) =>
  [...s.available, ...s.in_progress, ...s.completed].find((m) => m.id === id)?.name ?? `call ${id}`;
const names = (s: GameState, ids: number[], sep = "+") => ids.map((i) => nameOf(s, i)).join(sep);

export function describeAction(s: GameState, a: Action): string {
  return a.type === "Tick" ? `wait ${a.hours}h` : `dispatch ${names(s, a.soldierIds)} -> ${callName(s, a.missionId)}`;
}

export function describeOutcome(s: GameState, o: Outcome): string {
  switch (o._tag) {
    case "outcome/mission-available": return `NEW CALL: ${callName(s, o.missionId)}`;
    case "outcome/mission-completed": return `RESOLVED: ${callName(s, o.missionId)} (${names(s, o.soldierIds, ", ")} free)`;
    case "outcome/assignment-accepted": return `ACCEPTED: ${names(s, o.soldierIds)} -> ${callName(s, o.missionId)}`;
    default: return `REJECTED (${o._tag.split("/").pop()}): ${callName(s, o.missionId)}`;
  }
}

// Flat, ordered list behind the "Calls" pane cursor.
export type CallItem = { id: number; name: string; status: "WAITING" | "ACTIVE" | "DONE" };
export function callItems(s: GameState): CallItem[] {
  return [
    ...s.available.map((m): CallItem => ({ id: m.id, name: m.name, status: "WAITING" })),
    ...s.in_progress.map((m): CallItem => ({ id: m.id, name: m.name, status: "ACTIVE" })),
    ...s.completed.map((m): CallItem => ({ id: m.id, name: m.name, status: "DONE" })),
  ];
}

export function rosterStatus(s: GameState, id: number): string {
  const u = s.roster.find((r) => r.id === id)!;
  const on = s.in_progress.find((m) => m.assigned.includes(id));
  if (isDeployable(u)) return "DEPLOYABLE";
  if (on) return `busy on ${on.name} (${on.remaining}h left)`;
  return u.condition === "injured" ? "injured" : "resting-unfit";
}

// Unit card wording, distinct from the roster row.
export function cardStatus(s: GameState, id: number): string {
  const u = s.roster.find((r) => r.id === id)!;
  const on = s.in_progress.find((m) => m.assigned.includes(id));
  if (isDeployable(u)) return "ready to deploy";
  if (on) return `busy on ${on.name}`;
  return u.condition === "injured" ? "injured" : "not resting";
}

export function callDetail(s: GameState, c: CallItem): string {
  if (c.status === "WAITING") {
    const m = s.available.find((x) => x.id === c.id)!;
    return `needs ${m.requiredSolders}, ${m.duration}h`;
  }
  if (c.status === "ACTIVE") {
    const m = s.in_progress.find((x) => x.id === c.id)!;
    return `${m.remaining}h left, ${names(s, m.assigned)}`;
  }
  return "resolved";
}

// Ink's own wrap leaves a leading space on continuation lines, so prose is pre-wrapped.
export function wrapWords(text: string, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...out, line] : out;
}
