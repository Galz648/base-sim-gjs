import { Action, GameState } from "../src/lib/sim/domain";
import { legalActions } from "../src/lib/sim/legal";
import { step } from "./driver";
import { scenario } from "./scenario";
import { callItems, describeOutcome, Hit, LEFT_WIDTH, LogEntry, PANES, render, UiState } from "./view";

let state: GameState = scenario();
const history: LogEntry[] = [];
const ui: UiState = { focus: "actions", sel: { actions: 0, roster: 0, calls: 0 }, inspecting: false };
let hits: Record<number, Hit> = {};

const sizes = (): Record<UiState["focus"], number> => ({
  actions: legalActions(state).length,
  roster: state.roster.length,
  calls: callItems(state).length,
});

function draw() {
  const n = sizes();
  for (const p of PANES) ui.sel[p] = Math.max(0, Math.min(ui.sel[p], n[p] - 1));
  const r = render(state, history, legalActions(state), ui, process.stdout.columns ?? 120);
  hits = r.hits;
  process.stdout.write("\x1b[2J\x1b[H" + r.text + "\n");
}

function run(action: Action) {
  const r = step(state, action);
  if (!r.ok) {
    history.push({ day: state.day, hour: state.hour, text: `ERROR: ${r.error._tag}`, kind: "bad" });
    return;
  }
  state = r.state;
  for (const o of r.outcomes) {
    const kind = o._tag.startsWith("outcome/assignment-rejected") ? "bad" : o._tag === "outcome/mission-available" ? "info" : "good";
    history.push({ day: state.day, hour: state.hour, text: describeOutcome(state, o), kind });
  }
  ui.sel.actions = 0;
}

function activate() {
  if (ui.focus === "actions") run(legalActions(state)[ui.sel.actions]);
  else ui.inspecting = !ui.inspecting;
}

function cycle(dir: 1 | -1) {
  ui.focus = PANES[(PANES.indexOf(ui.focus) + dir + PANES.length) % PANES.length];
  ui.inspecting = false;
}

function quit() {
  process.stdout.write("\x1b[?1006l\x1b[?1000l\x1b[?25h");
  process.exit(0);
}

function onKey(key: string) {
  const n = sizes();
  const move = (d: number) => {
    const len = Math.max(1, n[ui.focus]);
    ui.sel[ui.focus] = (ui.sel[ui.focus] + d + len) % len;
  };
  if (key === "q" || key === "\x03") return quit();
  if (key === "x") return run({ _tag: "action/assign", type: "Assign", missionId: 999, soldierIds: [1] });
  if (key === "\t" || key === "\x1b[C" || key === "\x1bOC" || key === "l") cycle(1);
  else if (key === "\x1b[Z" || key === "\x1b[D" || key === "\x1bOD" || key === "h") cycle(-1);
  else if (key === "\x1b[A" || key === "\x1bOA" || key === "k") move(-1);
  else if (key === "\x1b[B" || key === "\x1bOB" || key === "j") move(1);
  else if (key === "\r" || key === "\n" || key === " " || key === "i") activate();
  else if (key === "\x1b") ui.inspecting = false;
  else {
    const num = Number(key);
    const actions = legalActions(state);
    if (Number.isInteger(num) && num >= 1 && num <= actions.length) run(actions[num - 1]);
  }
}

function onMouse(button: number, col: number, row: number, pressed: boolean) {
  if (!pressed || button !== 0 || col > LEFT_WIDTH) return;
  const h = hits[row];
  if (!h) return;
  const again = ui.focus === h.pane && ui.sel[h.pane] === h.index;
  if (ui.focus !== h.pane) ui.inspecting = false;
  ui.focus = h.pane;
  ui.sel[h.pane] = h.index;
  if (again) activate(); // click once to focus, click again to act / inspect
}

process.stdin.setRawMode?.(true);
process.stdin.setEncoding("utf8");
process.stdout.write("\x1b[?25l\x1b[?1000h\x1b[?1006h");
process.stdin.on("data", (chunk: string) => {
  const tokens = chunk.match(/\x1b\[<\d+;\d+;\d+[Mm]|\x1b\[Z|\x1b[\[O][A-D]|[\s\S]/g) ?? [];
  for (const t of tokens) {
    const m = t.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
    if (m) onMouse(Number(m[1]), Number(m[2]), Number(m[3]), m[4] === "M");
    else onKey(t);
  }
  draw();
});
process.on("exit", () => process.stdout.write("\x1b[?1006l\x1b[?1000l\x1b[?25h"));
draw();
