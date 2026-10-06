### Paths forward

- Dispatch a `MissionAssignmentEvent` from Bun and verify assign → countdown → complete → free in the log.
- Guard assignment: real roster ids, `rest`/`fit`, not already on `in_progress`.
- Keep `step` pure (no `throw`).
- Timer port: driver only calls `onTick`. Bun `setInterval`, Godot `Timer` later. Both intervals stay.
