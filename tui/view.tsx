import React from "react";
import { Box, renderToString, Text } from "ink";
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

// ---------- pure text helpers (no layout) ----------

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

const rosterStatus = (s: GameState, id: number): string => {
  const u = s.roster.find((r) => r.id === id)!;
  const on = s.in_progress.find((m) => m.assigned.includes(id));
  if (isDeployable(u)) return "DEPLOYABLE";
  if (on) return `busy on ${on.name} (${on.remaining}h left)`;
  return u.condition === "injured" ? "injured" : "resting-unfit";
};

// Unit card uses its own wording ("ready to deploy"), distinct from the roster row.
const cardStatus = (s: GameState, id: number): string => {
  const u = s.roster.find((r) => r.id === id)!;
  const on = s.in_progress.find((m) => m.assigned.includes(id));
  if (isDeployable(u)) return "ready to deploy";
  if (on) return `busy on ${on.name}`;
  return u.condition === "injured" ? "injured" : "not resting";
};

const callDetail = (s: GameState, c: CallItem): string => {
  if (c.status === "WAITING") {
    const m = s.available.find((x) => x.id === c.id)!;
    return `needs ${m.requiredSolders}, ${m.duration}h`;
  }
  if (c.status === "ACTIVE") {
    const m = s.in_progress.find((x) => x.id === c.id)!;
    return `${m.remaining}h left, ${m.assigned.map((id) => nameOf(s, id)).join("+")}`;
  }
  return "resolved";
};

// Ink's own wrap leaves a leading space on continuation lines, so prose is pre-wrapped.
function wrapWords(text: string, width: number): string[] {
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

const Prose = ({ children, width }: { children: string; width: number }) => (
  <Box flexDirection="column">
    {wrapWords(children, width).map((l, i) => (
      <Text key={i}>{l}</Text>
    ))}
  </Box>
);

// ---------- declarative components ----------

type Ctx = { state: GameState; history: LogEntry[]; actions: Action[]; ui: UiState };

// One selectable row. Inverse when it is the cursor of the focused pane.
const Row = ({ active, children }: { active: boolean; children: string }) => (
  <Text inverse={active} wrap="truncate-end">
    {active ? children.padEnd(LEFT_WIDTH - 1) : children}
  </Text>
);

const Section = ({ title, focused, children }: { title: string; focused: boolean; children: React.ReactNode }) => (
  <Box flexDirection="column">
    <Text bold inverse={focused}>
      {focused ? ` ${title} ` : title}
    </Text>
    {children}
  </Box>
);

const Roster = ({ state, ui, preview }: Pick<Ctx, "state" | "ui"> & { preview: Set<number> }) => (
  <Section title="Roster" focused={ui.focus === "roster"}>
    {state.roster.map((u, i) => {
      const active = ui.focus === "roster" && ui.sel.roster === i;
      const mark = active ? ">" : preview.has(u.id) ? "*" : " ";
      const hp = String(u.health).padStart(3);
      const sta = String(u.stamina).padStart(3);
      return (
        <Row key={u.id} active={active}>
          {` ${mark}${u.name.padEnd(8)} hp ${hp}  sta ${sta}  ${rosterStatus(state, u.id)}`}
        </Row>
      );
    })}
  </Section>
);

const Calls = ({ state, ui }: Pick<Ctx, "state" | "ui">) => {
  const items = callItems(state);
  return (
    <Section title="Calls" focused={ui.focus === "calls"}>
      {items.length === 0 && <Text>{"  none"}</Text>}
      {items.map((c, i) => {
        const active = ui.focus === "calls" && ui.sel.calls === i;
        return (
          <Row key={`${c.status}-${c.id}`} active={active}>
            {` ${active ? ">" : " "}[${c.status.padEnd(7)}] ${c.name} (${callDetail(state, c)})`}
          </Row>
        );
      })}
    </Section>
  );
};

const Actions = ({ state, actions, ui }: Pick<Ctx, "state" | "actions" | "ui">) => (
  <Section title="Actions" focused={ui.focus === "actions"}>
    {actions.map((a, i) => (
      <Row key={i} active={ui.focus === "actions" && ui.sel.actions === i}>
        {` ${ui.sel.actions === i ? ">" : " "} ${describeAction(state, a)}`}
      </Row>
    ))}
  </Section>
);

const Outcomes = ({ history, room, width }: { history: LogEntry[]; room: number; width: number }) => {
  const color = { info: undefined, good: "green", bad: "red" } as const;
  const shown = history.slice(-room);
  return (
    <Box flexDirection="column">
      <Text bold>Outcomes</Text>
      <Text dimColor>{"-".repeat(Math.min(width, 24))}</Text>
      {shown.length === 0 && <Text dimColor>(none yet)</Text>}
      {shown.map((e, i) => (
        <Text key={i} wrap="truncate-end">
          <Text dimColor>{`d${e.day} h${String(e.hour).padStart(2, "0")} `}</Text>
          <Text color={color[e.kind]}>{e.text}</Text>
        </Text>
      ))}
    </Box>
  );
};

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Text>
    {label.padEnd(12)}
    {children}
  </Text>
);

const UnitCard = ({ state, index, width }: { state: GameState; index: number; width: number }) => {
  const u = state.roster[index];
  if (!u) return <Text dimColor>(no unit)</Text>;
  const on = state.in_progress.find((m) => m.assigned.includes(u.id));
  const couldTake = state.available
    .map((m) => m.name + (m.requiredSolders > 1 ? ` (needs ${m.requiredSolders})` : ""))
    .join(", ");
  return (
    <Box flexDirection="column">
      <Text bold>UNIT CARD  {u.name}</Text>
      <Text dimColor>id {u.id}</Text>
      <Box flexDirection="column" marginTop={1}>
        <Fact label="Duty">{u.duty === "rest" ? "idle" : "busy"}</Fact>
        <Fact label="Condition">{u.condition}</Fact>
        <Fact label="Health">{u.health}</Fact>
        <Fact label="Stamina">{u.stamina}</Fact>
        <Fact label="Status">{cardStatus(state, u.id)}</Fact>
        {on && <Fact label="Assignment">{`${on.name} (${on.remaining}h left)`}</Fact>}
      </Box>
      <Box marginTop={1}>
        <Prose width={width}>{unitBio[u.id] ?? "No bio on file."}</Prose>
      </Box>
      <Box marginTop={1}>
        {isDeployable(u) ? (
          <Text>Could take: {couldTake || "no calls waiting"}</Text>
        ) : (
          <Text dimColor>Cannot be dispatched right now.</Text>
        )}
      </Box>
    </Box>
  );
};

const CallCard = ({ state, index, width }: { state: GameState; index: number; width: number }) => {
  const item = callItems(state)[index];
  if (!item) return <Text dimColor>(no call)</Text>;
  const ready = state.roster.filter(isDeployable);
  const waiting = state.available.find((m) => m.id === item.id);
  const active = state.in_progress.find((m) => m.id === item.id);
  return (
    <Box flexDirection="column">
      <Text bold>CALL BRIEF  {item.name}</Text>
      <Text dimColor>
        id {item.id}  {item.status}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {waiting && (
          <>
            <Fact label="Needs">{waiting.requiredSolders} unit(s)</Fact>
            <Fact label="Duration">{waiting.duration}h</Fact>
            <Fact label="Ready now">{ready.length ? ready.map((u) => u.name).join(", ") : "nobody"}</Fact>
            <Fact label="Dispatch">{ready.length >= waiting.requiredSolders ? "possible" : "not enough ready units"}</Fact>
          </>
        )}
        {active && (
          <>
            <Fact label="Remaining">{active.remaining}h</Fact>
            <Fact label="Crew">{active.assigned.map((i) => nameOf(state, i)).join(", ")}</Fact>
          </>
        )}
        {item.status === "DONE" && <Text>Resolved.</Text>}
      </Box>
      <Box marginTop={1}>
        <Prose width={width}>{callBrief[item.id] ?? "No briefing on file."}</Prose>
      </Box>
    </Box>
  );
};

const Screen = ({ state, history, actions, ui, termCols }: Ctx & { termCols: number }) => {
  const picked = actions[ui.sel.actions];
  const preview = new Set(picked?.type === "Assign" ? picked.soldierIds : []);
  const paneWidth = Math.max(20, termCols - LEFT_WIDTH - 3);
  const showCard = ui.inspecting && ui.focus !== "actions";
  const leftHeight = 3 + state.roster.length + 1 + Math.max(1, callItems(state).length) + 1 + 1 + actions.length + 2;
  return (
    <Box width={termCols}>
      <Box flexDirection="column" width={LEFT_WIDTH + 1} flexShrink={0}>
        <Text>
          Day {state.day} Hour {state.hour}
        </Text>
        <Box flexDirection="column" marginTop={1}>
          <Roster state={state} ui={ui} preview={preview} />
          <Calls state={state} ui={ui} />
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Actions state={state} actions={actions} ui={ui} />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>tab pane, arrows move, enter, esc, q</Text>
        </Box>
      </Box>
      <Box
        flexDirection="column"
        flexGrow={1}
        paddingLeft={1}
        borderStyle="single"
        borderColor="gray"
        borderTop={false}
        borderBottom={false}
        borderRight={false}
      >
        {showCard ? (
          <>
            {ui.focus === "roster" ? (
              <UnitCard state={state} index={ui.sel.roster} width={paneWidth} />
            ) : (
              <CallCard state={state} index={ui.sel.calls} width={paneWidth} />
            )}
            <Box marginTop={1}>
              <Text dimColor>[esc] close card</Text>
            </Box>
          </>
        ) : (
          <Outcomes history={history} room={Math.max(1, leftHeight - 2)} width={paneWidth} />
        )}
      </Box>
    </Box>
  );
};

// Screen rows (1-based) of every selectable row in the left column, for mouse hit-testing.
// Must mirror the vertical order in <Screen>: clock, gap, Roster, Calls, gap, Actions.
function hitRows(state: GameState, actions: Action[]): Record<number, Hit> {
  const hits: Record<number, Hit> = {};
  let row = 3; // 1 clock + 1 gap -> Roster title is row 3
  row += 1;
  state.roster.forEach((_, i) => (hits[row++] = { pane: "roster", index: i }));
  row += 1; // Calls title
  const calls = callItems(state);
  if (calls.length === 0) row += 1;
  calls.forEach((_, i) => (hits[row++] = { pane: "calls", index: i }));
  row += 2; // gap + Actions title
  actions.forEach((_, i) => (hits[row++] = { pane: "actions", index: i }));
  return hits;
}

// Pure: everything in, screen text + click map out.
export function render(
  state: GameState,
  history: LogEntry[],
  actions: Action[],
  ui: UiState,
  termCols = 120,
): { text: string; hits: Record<number, Hit> } {
  const text = renderToString(
    <Screen state={state} history={history} actions={actions} ui={ui} termCols={termCols} />,
    { columns: termCols },
  );
  return { text, hits: hitRows(state, actions) };
}
