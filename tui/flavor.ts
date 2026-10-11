// TUI-side flavor text only. The sim has no descriptions, so these are keyed by id and optional.
export const callBrief: Record<number, string> = {
  1: "Unattended bag reported near the main gate. Cordon the area, hold traffic and wait for the sapper to clear it.",
  2: "Fence sensor tripped on the northern sector, no visual yet. Send a squad to confirm and sweep the line.",
  3: "Supply convoy moving between two outposts through a flagged stretch. Needs two squads: one lead, one rear cover.",
  4: "Routine vehicle check at the gate during shift change. Low priority, but the queue is building.",
  5: "Training exercise is running hot and a medic team is on call. Needs two squads to secure the landing zone and hold the road.",
};

export const unitBio: Record<number, string> = {
  1: "Veteran squad, steady under pressure. Default first responders for the gate.",
  2: "Patrol specialists, quick on the radio and strong on the fence line.",
  3: "Newest squad, full of stamina and keen to prove themselves.",
};
