import { ActiveMission, AliveSoldierState, GameEvent, GameState } from "./domain";

// ANSI colors only when printing to a real terminal (Bun). Godot's Output panel prints the escape
// codes raw (and GodotJS has no `process`), so inside Godot the board is plain text.
const color =
  typeof process !== "undefined" && process.stdout?.isTTY === true;
const esc = (code: string): string => (color ? `\x1b[${code}m` : "");

const ansi = {
  reset: esc("0"),
  dim: esc("2"),
  bold: esc("1"),
  cyan: esc("36"),
  green: esc("32"),
  yellow: esc("33"),
  red: esc("31"),
};

const dutyAnsi: Record<AliveSoldierState["duty"], string> = {
  active: ansi.green,
  rest: ansi.yellow,
};

const conditionAnsi: Record<AliveSoldierState["condition"], string> = {
  fit: ansi.green,
  injured: ansi.red,
};

function vitalAnsi(n: number): string {
  if (n >= 70) return ansi.green;
  if (n >= 40) return ansi.yellow;
  return ansi.red;
}

function paintNum(n: number): string {
  return `${vitalAnsi(n)}${String(n).padStart(3)}${ansi.reset}`;
}

const arrow = `${ansi.dim}->${ansi.reset}`;

function showNum(label: string, before: number, after: number): string {
  if (before === after) return `${label} ${paintNum(after)}`;
  return `${label} ${paintNum(before)} ${arrow} ${paintNum(after)}`;
}

function paintDuty(duty: AliveSoldierState["duty"]): string {
  return `${dutyAnsi[duty]}${ansi.bold}${duty.padEnd(6)}${ansi.reset}`;
}

function showDuty(
  before: AliveSoldierState["duty"],
  after: AliveSoldierState["duty"]
): string {
  if (before === after) return paintDuty(after);
  return `${paintDuty(before)} ${arrow} ${paintDuty(after)}`;
}

function paintCondition(condition: AliveSoldierState["condition"]): string {
  return `${conditionAnsi[condition]}${condition}${ansi.reset}`;
}

function showCondition(
  before: AliveSoldierState["condition"],
  after: AliveSoldierState["condition"]
): string {
  if (before === after) return paintCondition(after);
  return `${paintCondition(before)} ${arrow} ${paintCondition(after)}`;
}

function showClock(before: GameState, after: GameState): string {
  const day =
    before.day === after.day
      ? `day ${before.day}`
      : `day ${before.day} ${arrow} ${after.day}`;
  const hour =
    before.hour === after.hour
      ? `hour ${String(after.hour).padStart(2)}`
      : `hour ${String(before.hour).padStart(2)} ${arrow} ${String(after.hour).padStart(2)}`;
  return `${day}  ${hour}`;
}

function rosterTransition(before: GameState, after: GameState): string {
  const afterById = new Map<number, AliveSoldierState>();
  for (const s of after.roster) afterById.set(s.id, s);
  const seen = new Set<number>();
  const lines: string[] = [];

  for (const prev of before.roster) {
    seen.add(prev.id);
    const next = afterById.get(prev.id);
    if (!next) {
      lines.push(`  ${prev.name.padEnd(8)} ${ansi.red}left${ansi.reset}`);
      continue;
    }
    lines.push(
      `  ${prev.name.padEnd(8)} ${showDuty(prev.duty, next.duty)}  ${showCondition(prev.condition, next.condition)}  ${showNum("hp", prev.health, next.health)}  ${showNum("stamina", prev.stamina, next.stamina)}`
    );
  }

  for (const next of after.roster) {
    if (seen.has(next.id)) continue;
    lines.push(`  ${next.name.padEnd(8)} ${ansi.green}joined${ansi.reset}`);
  }

  return lines.join("\n");
}

function visibleLen(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function padVisible(s: string, width: number): string {
  const n = visibleLen(s);
  if (n > width) return s.replace(/\x1b\[[0-9;]*m/g, "").slice(0, width);
  return s + " ".repeat(width - n);
}

function crewNames(ids: number[], roster: AliveSoldierState[]): string {
  if (ids.length === 0) return "—";
  const byId = new Map<number, string>();
  for (const s of roster) byId.set(s.id, s.name);
  return ids.map((id) => byId.get(id) ?? `#${id}`).join(", ");
}

function showHours(label: string, before: number, after: number): string {
  if (before === after) return `${label} ${after}h`;
  return `${label} ${before}h ${arrow} ${after}h`;
}

function section(title: string, rows: string[]): string[] {
  const lines = [`${ansi.dim}${title}${ansi.reset}`];
  if (rows.length === 0) {
    lines.push(`  ${ansi.dim}none${ansi.reset}`);
    return lines;
  }
  return lines.concat(rows);
}

function missionPanel(before: GameState, after: GameState): string[] {
  const beforeActive = new Map<number, ActiveMission>();
  for (const m of before.in_progress) beforeActive.set(m.id, m);

  const available: string[] = [];
  for (const m of after.available) {
    available.push(`  ${ansi.bold}${m.name}${ansi.reset}`);
    available.push(`    need ${m.requiredSolders}  ${m.duration}h`);
  }

  const active: string[] = [];
  for (const m of after.in_progress) {
    const prev = beforeActive.get(m.id);
    const remaining = prev
      ? showHours("remaining", prev.remaining, m.remaining)
      : `remaining ${m.remaining}h`;
    active.push(`  ${ansi.cyan}${ansi.bold}${m.name}${ansi.reset}`);
    active.push(`    ${remaining}`);
    if (m.assigned.length > 0) {
      active.push(
        `    ${ansi.dim}${crewNames(m.assigned, after.roster)}${ansi.reset}`
      );
    }
  }

  const completed: string[] = [];
  for (const m of after.completed) {
    completed.push(`  ${ansi.green}${m.name}${ansi.reset}`);
  }

  return [
    ...section("available", available),
    ...section("active", active),
    ...section("completed", completed),
  ];
}

function zipColumns(left: string[], right: string[]): string {
  const leftWidth = 56;
  const gutter = ` ${ansi.dim}│${ansi.reset} `;
  const rows = Math.max(left.length, right.length);
  const lines: string[] = [];
  for (let i = 0; i < rows; i++) {
    lines.push(
      `${padVisible(left[i] ?? "", leftWidth)}${gutter}${right[i] ?? ""}`
    );
  }
  return lines.join("\n");
}

export function logTransition(
  before: GameState,
  event: GameEvent,
  after: GameState
): void {
  const left = [
    `${ansi.dim}event${ansi.reset}  ${ansi.bold}${ansi.cyan}${event.type}${ansi.reset}`,
    `${ansi.dim}state${ansi.reset}  ${showClock(before, after)}`,
    ...rosterTransition(before, after).split("\n"),
  ];
  console.log(zipColumns(left, missionPanel(before, after)));
}

export function logApply(state: GameState, event: GameEvent): void {
  const left = [
    `${ansi.dim}event${ansi.reset}  ${ansi.bold}${ansi.cyan}${event.type}${ansi.reset}`,
    `${ansi.dim}state${ansi.reset}  day ${state.day}  hour ${String(state.hour).padStart(2)}`,
    ...state.roster.map((s) => {
      return `  ${s.name.padEnd(8)} ${paintDuty(s.duty)}  ${paintCondition(s.condition)}  hp ${paintNum(s.health)}  stamina ${paintNum(s.stamina)}`;
    }),
  ];
  console.log(zipColumns(left, missionPanel(state, state)));
}
