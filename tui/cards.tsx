// The two inspect cards. Each is a plain component of facts + a prose blurb.
import React from "react";
import { Box, Text } from "ink";
import { GameState, canDispatch, unitStatus } from "../src/lib/sim/api";
import { callBrief, unitBio } from "./flavor";
import { cardStatus, callItems, nameOf, wrapWords } from "./model";

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Text>{label.padEnd(12)}{children}</Text>
);

const Prose = ({ children, width }: { children: string; width: number }) => (
  <Box flexDirection="column" marginTop={1}>
    {wrapWords(children, width).map((l, i) => <Text key={i}>{l}</Text>)}
  </Box>
);

type CardProps = { state: GameState; index: number; width: number };

export const UnitCard = ({ state, index, width }: CardProps) => {
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
      <Prose width={width}>{unitBio[u.id] ?? "No bio on file."}</Prose>
      <Box marginTop={1}>
        {unitStatus(state, u.id) === "deployable"
          ? <Text>Could take: {couldTake || "no calls waiting"}</Text>
          : <Text dimColor>Cannot be dispatched right now.</Text>}
      </Box>
    </Box>
  );
};

export const CallCard = ({ state, index, width }: CardProps) => {
  const item = callItems(state)[index];
  if (!item) return <Text dimColor>(no call)</Text>;
  const ready = state.roster.filter((u) => unitStatus(state, u.id) === "deployable");
  const waiting = state.available.find((m) => m.id === item.id);
  const active = state.in_progress.find((m) => m.id === item.id);
  return (
    <Box flexDirection="column">
      <Text bold>CALL BRIEF  {item.name}</Text>
      <Text dimColor>id {item.id}  {item.status.toUpperCase()}</Text>
      <Box flexDirection="column" marginTop={1}>
        {waiting && <>
          <Fact label="Needs">{waiting.requiredSolders} unit(s)</Fact>
          <Fact label="Duration">{waiting.duration}h</Fact>
          <Fact label="Ready now">{ready.length ? ready.map((u) => u.name).join(", ") : "nobody"}</Fact>
          <Fact label="Dispatch">{canDispatch(state, item.id) ? "possible" : "not enough ready units"}</Fact>
        </>}
        {active && <>
          <Fact label="Remaining">{active.remaining}h</Fact>
          <Fact label="Crew">{active.assigned.map((i) => nameOf(state, i)).join(", ")}</Fact>
        </>}
        {item.status === "done" && <Text>Resolved.</Text>}
      </Box>
      <Prose width={width}>{callBrief[item.id] ?? "No briefing on file."}</Prose>
    </Box>
  );
};
