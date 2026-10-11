// The screen, declaratively. Read <Screen> first: it is the whole TUI layout.
import React from "react";
import { Box, renderToString, Text } from "ink";
import { Action, GameState } from "../src/lib/sim/domain";
import { CallCard, UnitCard } from "./cards";
import {
  callDetail, callItems, describeAction, LEFT_WIDTH, rosterStatus,
  type Hit, type LogEntry, type UiState,
} from "./model";

export { callItems, describeOutcome, LEFT_WIDTH, PANES } from "./model";
export type { Hit, LogEntry, Pane, UiState } from "./model";

type Props = { state: GameState; history: LogEntry[]; actions: Action[]; ui: UiState; cols: number };

// ---- the layout -----------------------------------------------------------------------------
//  ┌ left column ─────────────────────┐ ┌ right pane ─────────────┐
//  │ clock                            │ │ card (inspecting)       │
//  │ Roster / Calls                   │ │   or                    │
//  │ Actions                          │ │ Outcomes (history)      │
//  │ help                             │ │                         │
//  └──────────────────────────────────┘ └─────────────────────────┘
const Screen = ({ state, history, actions, ui, cols }: Props) => {
  const paneWidth = Math.max(20, cols - LEFT_WIDTH - 3);
  const card = ui.inspecting && ui.focus !== "actions";
  const leftHeight = 8 + state.roster.length + Math.max(1, callItems(state).length) + actions.length;
  return (
    <Box width={cols}>
      <Column>
        <Text>Day {state.day} Hour {state.hour}</Text>
        <Box flexDirection="column">
          <Roster state={state} ui={ui} preview={previewIds(actions[ui.sel.actions])} />
          <Calls state={state} ui={ui} />
        </Box>
        <Actions state={state} actions={actions} ui={ui} />
        <Text dimColor>tab pane, arrows move, enter, esc, q</Text>
      </Column>
      <SidePane>
        {card && ui.focus === "roster" && <UnitCard state={state} index={ui.sel.roster} width={paneWidth} />}
        {card && ui.focus === "calls" && <CallCard state={state} index={ui.sel.calls} width={paneWidth} />}
        {card && <Text dimColor>{"\n"}[esc] close card</Text>}
        {!card && <Outcomes history={history} room={Math.max(1, leftHeight - 2)} width={paneWidth} />}
      </SidePane>
    </Box>
  );
};

// ---- layout shells --------------------------------------------------------------------------
const Column = ({ children }: { children: React.ReactNode }) => (
  <Box flexDirection="column" gap={1} width={LEFT_WIDTH + 1} flexShrink={0}>{children}</Box>
);

const SidePane = ({ children }: { children: React.ReactNode }) => (
  <Box flexDirection="column" flexGrow={1} paddingLeft={1} borderStyle="single" borderColor="gray"
       borderTop={false} borderBottom={false} borderRight={false}>{children}</Box>
);

const Section = ({ title, focused, children }: { title: string; focused: boolean; children: React.ReactNode }) => (
  <Box flexDirection="column">
    <Text bold inverse={focused}>{focused ? ` ${title} ` : title}</Text>
    {children}
  </Box>
);

// One selectable row: inverse when it is the cursor of the focused pane.
const Row = ({ active, children }: { active: boolean; children: string }) => (
  <Text inverse={active} wrap="truncate-end">{active ? children.padEnd(LEFT_WIDTH - 1) : children}</Text>
);

// ---- panes ----------------------------------------------------------------------------------
type PaneProps = { state: GameState; ui: UiState };

const Roster = ({ state, ui, preview }: PaneProps & { preview: Set<number> }) => (
  <Section title="Roster" focused={ui.focus === "roster"}>
    {state.roster.map((u, i) => {
      const active = ui.focus === "roster" && ui.sel.roster === i;
      const mark = active ? ">" : preview.has(u.id) ? "*" : " ";
      const hp = String(u.health).padStart(3), sta = String(u.stamina).padStart(3);
      return <Row key={u.id} active={active}>{` ${mark}${u.name.padEnd(10)} hp ${hp}  sta ${sta}  ${rosterStatus(state, u.id)}`}</Row>;
    })}
  </Section>
);

const Calls = ({ state, ui }: PaneProps) => {
  const items = callItems(state);
  return (
    <Section title="Calls" focused={ui.focus === "calls"}>
      {items.length === 0 && <Text>{"  none"}</Text>}
      {items.map((c, i) => {
        const active = ui.focus === "calls" && ui.sel.calls === i;
        return <Row key={`${c.status}-${c.id}`} active={active}>
          {` ${active ? ">" : " "}[${c.status.padEnd(7)}] ${c.name} (${callDetail(state, c)})`}
        </Row>;
      })}
    </Section>
  );
};

const Actions = ({ state, actions, ui }: PaneProps & { actions: Action[] }) => (
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
  return (
    <Box flexDirection="column">
      <Text bold>Outcomes</Text>
      <Text dimColor>{"-".repeat(Math.min(width, 24))}</Text>
      {history.length === 0 && <Text dimColor>(none yet)</Text>}
      {history.slice(-room).map((e, i) => (
        <Text key={i} wrap="truncate-end">
          <Text dimColor>{`d${e.day} h${String(e.hour).padStart(2, "0")} `}</Text>
          <Text color={color[e.kind]}>{e.text}</Text>
        </Text>
      ))}
    </Box>
  );
};

// ---- non-visual helpers ---------------------------------------------------------------------
const previewIds = (a?: Action) => new Set(a?.type === "Assign" ? a.soldierIds : []);

// Screen rows (1-based) of every selectable row, for mouse hit-testing. Mirrors <Screen>'s order:
// clock, gap, Roster, Calls, gap, Actions.
function hitRows(state: GameState, actions: Action[]): Record<number, Hit> {
  const hits: Record<number, Hit> = {};
  let row = 4; // clock(1) + gap(2) + Roster title(3) -> first roster row is 4
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
export function render(state: GameState, history: LogEntry[], actions: Action[], ui: UiState, cols = 120) {
  const text = renderToString(<Screen state={state} history={history} actions={actions} ui={ui} cols={cols} />, { columns: cols });
  return { text, hits: hitRows(state, actions) };
}
