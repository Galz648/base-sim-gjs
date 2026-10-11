import { Action, GameState, Outcome } from "../src/lib/sim/domain";
import { isDeployable } from "../src/lib/sim/legal";
import { callBrief, unitBio } from "./flavor";

export type Pane = "actions" | "roster" | "calls";
export const PANES: Pane[] = ["roster", "calls", "actions"];
export type UiState = {
  focus: Pane;
  sel: Record<Pane, number>;
  inspecting: boolean;
};
export type Hit = { pane: Pane; index: number };
export type LogEntry = { day: number; hour: number; text: string; kind: "info" | "good" | "bad" };

export const LEFT_WIDTH = 66;

const nameOf = (s: GameState, id: number) => s.roster.find((r) => r.id === id)?.name ?? `#${id}`;
const callName = (s: GameState, id: number) =>
  [...s.available, ...s.in_progress, ...s.completed].find((m) => m.id === id)?.name ?? `call ${id}`;

export function describeAction(s: GameState, a: Action): string {
  if (a.type === "Tick") return `wait ${a.hours}h`;
  return `dispatch ${a.soldierIds.map((i) => nameOf(s, i)).join("+")} -> ${callName(s, a.missionId)}`;
}

export function describeOutcome(s: GameState, o: Outcome): string {
  switch (o._tag) {
    case "outcome/mission-available":
      return `NEW CALL: ${callName(s, o.missionId)}`;
    case "outcome/mission-completed":
      return `RESOLVED: ${callName(s, o.missionId)} (${o.soldierIds.map((i) => nameOf(s, i)).join(", ")} free)`;
    case "outcome/assignment-accepted":
      return `ACCEPTED: ${o.soldierIds.map((i) => nameOf(s, i)).join("+")} -> ${callName(s, o.missionId)}`;
    default:
      return `REJECTED (${o._tag.split("/").pop()}): ${callName(s, o.missionId)}`;
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

const inv = (s: string) => `\x1b[7m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const paint = (code: number, s: string) => `\x1b[${code}m${s}\x1b[0m`;
const ANSI = /\x1b\[[0-9;]*m/g;
const visLen = (s: string) => s.replace(ANSI, "").length;

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) out.push(line);
  return out;
}

function unitCard(s: GameState, index: number, width: number): string[] {
  const u = s.roster[index];
  if (!u) return [dim("(no unit)")];
  const on = s.in_progress.find((m) => m.assigned.includes(u.id));
  const waiting = s.available;
  const why = isDeployable(u) ? "ready to deploy" : on ? `busy on ${on.name}` : u.condition === "injured" ? "injured" : "not resting";
  return [
    bold(`UNIT CARD  ${u.name}`),
    dim(`id ${u.id}`),
    "",
    `Duty        ${u.duty === "rest" ? "idle" : "busy"}`,
    `Condition   ${u.condition}`,
    `Health      ${u.health}`,
    `Stamina     ${u.stamina}`,
    `Status      ${why}`,
    ...(on ? [`Assignment  ${on.name} (${on.remaining}h left)`] : []),
    "",
    ...wrap(unitBio[u.id] ?? "No bio on file.", width),
    "",
    isDeployable(u)
      ? `Could take: ${waiting.length ? waiting.map((m) => m.name + (m.requiredSolders > 1 ? ` (needs ${m.requiredSolders})` : "")).join(", ") : "no calls waiting"}`
      : dim("Cannot be dispatched right now."),
  ];
}

function callCard(s: GameState, index: number, width: number): string[] {
  const item = callItems(s)[index];
  if (!item) return [dim("(no call)")];
  const brief = wrap(callBrief[item.id] ?? "No briefing on file.", width);
  const head = [bold(`CALL BRIEF  ${item.name}`), dim(`id ${item.id}  ${item.status}`), ""];
  if (item.status === "WAITING") {
    const m = s.available.find((x) => x.id === item.id)!;
    const ready = s.roster.filter(isDeployable);
    return [
      ...head,
      `Needs       ${m.requiredSolders} unit(s)`,
      `Duration    ${m.duration}h`,
      `Ready now   ${ready.length ? ready.map((u) => u.name).join(", ") : "nobody"}`,
      `Dispatch    ${ready.length >= m.requiredSolders ? "possible" : "not enough ready units"}`,
      "",
      ...brief,
    ];
  }
  if (item.status === "ACTIVE") {
    const m = s.in_progress.find((x) => x.id === item.id)!;
    return [
      ...head,
      `Remaining   ${m.remaining}h`,
      `Crew        ${m.assigned.map((i) => nameOf(s, i)).join(", ")}`,
      "",
      ...brief,
    ];
  }
  return [...head, "Resolved.", "", ...brief];
}

// Pure: everything in, screen text + click map out. Hit rows are 1-based screen rows (left column only).
export function render(
  state: GameState,
  history: LogEntry[],
  actions: Action[],
  ui: UiState,
  termCols = 120,
): { text: string; hits: Record<number, Hit> } {
  const hits: Record<number, Hit> = {};
  const head: string[] = [];
  const hit = (pane: Pane, index: number) => {
    hits[head.length + 1] = { pane, index };
  };
  const title = (pane: Pane, label: string) => (ui.focus === pane ? inv(` ${label} `) : bold(label));
  const cur = (pane: Pane, i: number) => ui.focus === pane && ui.sel[pane] === i;

  const picked = actions[ui.sel.actions];
  const preview = new Set(picked?.type === "Assign" ? picked.soldierIds : []);

  head.push(`Day ${state.day} Hour ${state.hour}`, "");

  head.push(title("roster", "Roster"));
  state.roster.forEach((u, i) => {
    const on = state.in_progress.find((m) => m.assigned.includes(u.id));
    const status = isDeployable(u)
      ? "DEPLOYABLE"
      : on
        ? `busy on ${on.name} (${on.remaining}h left)`
        : u.condition === "injured"
          ? "injured"
          : "resting-unfit";
    const mark = cur("roster", i) ? ">" : preview.has(u.id) ? "*" : " ";
    const line = ` ${mark}${u.name.padEnd(8)} hp ${String(u.health).padStart(3)}  sta ${String(u.stamina).padStart(3)}  ${status}`;
    hit("roster", i);
    head.push(cur("roster", i) ? inv(line) : line);
  });

  head.push(title("calls", "Calls"));
  const items = callItems(state);
  if (items.length === 0) head.push("  none");
  items.forEach((c, i) => {
    const detail =
      c.status === "WAITING"
        ? (() => { const m = state.available.find((x) => x.id === c.id)!; return `needs ${m.requiredSolders}, ${m.duration}h`; })()
        : c.status === "ACTIVE"
          ? (() => { const m = state.in_progress.find((x) => x.id === c.id)!; return `${m.remaining}h left, ${m.assigned.map((id) => nameOf(state, id)).join("+")}`; })()
          : "resolved";
    const line = ` ${cur("calls", i) ? ">" : " "}[${c.status.padEnd(7)}] ${c.name} (${detail})`;
    hit("calls", i);
    head.push(cur("calls", i) ? inv(line) : line);
  });

  head.push("");
  head.push(title("actions", "Actions"));
  actions.forEach((a, i) => {
    const line = ` ${ui.sel.actions === i ? ">" : " "} ${describeAction(state, a)}`;
    hit("actions", i);
    head.push(ui.focus === "actions" && ui.sel.actions === i ? inv(line) : line);
  });
  head.push("");
  head.push(dim("tab pane, arrows move, enter, esc, q"));
  const left = head;

  const width = Math.max(20, termCols - LEFT_WIDTH - 3);
  let right: string[];
  if (ui.inspecting && ui.focus !== "actions") {
    const card = ui.focus === "roster" ? unitCard(state, ui.sel.roster, width) : callCard(state, ui.sel.calls, width);
    right = [...card, "", dim("[esc] close card")];
  } else {
    const clip = (t: string) => (t.length > width - 7 ? t.slice(0, width - 8) + "…" : t);
    const color = { info: 0, good: 32, bad: 31 } as const;
    const room = Math.max(1, left.length - 2);
    const shown = history.slice(-room).map((e) => {
      const stamp = dim(`d${e.day} h${String(e.hour).padStart(2, "0")}`);
      return `${stamp} ${paint(color[e.kind], clip(e.text))}`;
    });
    right = [bold("Outcomes"), dim("-".repeat(Math.min(width, 24))), ...(shown.length ? shown : [dim("(none yet)")])];
  }

  const rows = Math.max(left.length, right.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    const l = left[i] ?? "";
    out.push(`${l}${" ".repeat(Math.max(0, LEFT_WIDTH - visLen(l)))} ${dim("│")} ${right[i] ?? ""}`);
  }
  return { text: out.join("\n"), hits };
}
