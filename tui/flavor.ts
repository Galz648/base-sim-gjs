// TUI-side flavor text only. The sim has no descriptions, so these are keyed by id and optional.
export const callBrief: Record<number, string> = {
  1: "Neighbour reports a forced back door and a missing laptop. Suspect left on foot. Take a statement and secure the scene.",
  2: "Two-car collision at a junction, one driver complaining of neck pain. Clear the road and file the report.",
  3: "Armed robbery at a convenience store, suspect fled in a grey hatchback. Needs two units: one to canvass, one to cover.",
  4: "Repeated noise complaint from the same flat. Low urgency, but it will not go away on its own.",
  5: "Alarm at a warehouse, possible fire. Needs two units to sweep the building and hold the perimeter.",
};

export const unitBio: Record<number, string> = {
  1: "Veteran patrol officer, steady under pressure.",
  2: "Traffic specialist, quick on the radio.",
  3: "Rookie with plenty of stamina, keen to prove themself.",
};
