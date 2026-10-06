### Development approach

Gameplay is developed in Bun first. Godot comes later, for scenes and presentation. The simulation should be writable and runnable without the editor, the scene tree, or GDScript conversion in the loop.

The game is modeled as functions over typed values. Visuals wait until that model is reasonable to play.

### Runtime shim

`Sim` does not call Bun or Godot directly. Each runtime constructs a shim and passes it into the `Sim` constructor. The class only calls that shim.

`MathPort` in `sim/boundary.ts` is the current evidence. Bun fills it in `src/bun/entrypoint.ts` with `Math.floor` and a clamp. The Godot entry in `src/scripts/main.ts` fills the same port with GDScript `floor` and `clamp`.

New runtime capabilities are further properties on that same shim. A timer is the next one: `Sim.start` still drives the hour loop, but through a timer port shaped like Godot's `Timer`, so the Bun loop and the Godot loop share one call site.

The timer is not implemented yet. `Sim.start` still owns both `setInterval`s. When the port exists, it lands in the places below. No Bun timer class, `setInterval`, or other runtime body goes into a file tstogd converts.

Assignment is an event (`MissionAssignmentEvent`), reduced in `src/sim/sim.ts`. Bun does not dispatch one yet. Do that from `src/bun/entrypoint.ts`, not from converted Godot scripts.

### Where shim pieces sit

| Piece                                                                       | Path              | Why                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port types (`MathPort`, later `Timer`, and the shim object that holds them) | `sim/boundary.ts` | Shared contract. Listed in `tsconfig.json` `include` so both Bun and Godot TypeScript can see it. Outside `tstogd.json` `tsDir`, so the converter does not emit a `.gd` for the contract.                                                                   |
| Gameplay that only calls the ports                                          | `src/sim/`        | Outside `tsDir` (`src/scripts`). Safe to run under Bun while the rules stay runtime-agnostic.                                                                                                                                                               |
| Bun implementations and the Bun entry                                       | `src/bun/`        | `tstogd.json` `exclude` already lists `src/bun/**`. `src/bun/.gdignore` keeps Godot from importing the folder. `src/bun/entrypoint.ts` is where the shim object is built and passed to `Sim`. A Bun timer belongs in `src/bun/timer.ts` and is wired there. |
| Godot scripts                                                               | `src/scripts/`    | This is `tsDir`. tstogd writes `scripts/`. The Godot side of a port is constructed here (today: math in `main.ts`, and a scene `Timer` node). It must not import `src/bun/`.                                                                                |

`src/sim/` may later be shared with Godot only if it imports port types and nothing from `src/bun/`. A value import of a Bun module from `src/scripts/` or from gameplay that gets converted would pull that implementation into `.gd` output.
