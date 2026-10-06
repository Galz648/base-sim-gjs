# Base Sim on GodotJS + Bun

This project is the `feat/mission` branch of base-sim (commit `5d2087b`, "docs: record mission loop and leftover work", the newest commit where `bun run typecheck` passes and the Bun sim runs) ported from TypeScript-to-GDScript (`tstogd`) to **GodotJS + Bun**. The original repo was not modified; this is a separate copy. Toolchain comes from the `godotjs-esm` project (`tools/new-project.ts` scaffold).

## What it is

- **The sim is unchanged plain TypeScript** (`src/lib/sim/`): `config.ts`, `domain.ts`, `utils.ts` and `boundary.ts` are byte-identical to the original; `sim.ts` changed in 3 lines (the `boundary` import path and `Callable` to `() => void`). It runs under Bun (`bun/entrypoint.ts`) and inside Godot (`src/scripts/main.ts`) from the same code. No `.gd` files are generated.
- **Godot only hosts it.** `src/scripts/main.ts` is the node script: it creates the `Sim` and calls `sim.start()`; the sim ticks itself with `setInterval`. The original Godot-side class (`src/scripts/sim.ts`, a second, GDScript-shaped sim with different seed data) is dropped: it was the reason the Godot log differed from the Bun log.
- **Bun builds it for Godot.** `bun run build` bundles every `src/**/*.ts` except `src/lib/**` into `.godot/GodotJS/<same path>.js`. The scene attaches the `.ts` (`res://src/scripts/main.ts`) and GodotJS runs the mirrored bundle.

## Run it

```sh
export GODOTJS=/path/to/godot.macos.editor.universal   # stock GodotJS build for Godot 4.6.1 (quickjs-ng)
bun install
bun run bun          # the sim in Bun, no Godot (same hour ticks)
bun run build && bun run headless          # the sim inside Godot, headless, quits after 300 frames
bun run dev          # rebuild + relaunch the game on save
bun run dev:build    # watch-only, with the editor open (the hot_reload addon refreshes scripts)
"$GODOTJS" --editor --path .
bun run typecheck    # tsc --noEmit (also the pre-commit hook: git config core.hooksPath .githooks)
```

## Layout

| Path | What |
|---|---|
| `src/lib/sim/` | the pure sim (not emitted as a Godot script; Bun inlines it) |
| `src/scripts/main.ts` | Godot-facing node script |
| `src/scenes/main.tscn` | main scene (original path kept) |
| `bun/entrypoint.ts` | Bun-side runner (`.gdignore` so Godot skips it) |
| `docs/` | your original design docs, unchanged (the `sandbox/` drills and `tstogd-cheatsheet.md` are tstogd-specific) |
| `build.ts`, `tools/`, `addons/`, `polyfills/`, `typings/` | toolchain from the scaffold |

## What differs from the tstogd version

- No `tstogd convert/watch`, no `typescript-to-gdscript` dependency, no `scripts/*.gd`, no `scene-tree` extension, no `examples/` or `sketches/` (these were GDScript-oriented and are not carried over).
- Dropped husky/lint-staged/prettier (not needed to run); the pre-commit hook is just `bun run typecheck`.
- Godot **4.6.1** (stock GodotJS release). Your `project.godot` listed 4.7 features; GodotJS for 4.7 is not available as a stock build yet.
- Gotchas worth knowing: create script instances in code with `load(path).call("new")` (not `new Node()` + `set_script`); GDScript-only globals (`floor`, `clamp`, `print`, `Timer` signal wiring) need their JS forms; JS timers ignore `SceneTree.paused`. See the `godotjs-esm` docs (`GDSCRIPT-TO-GODOTJS.md`, `under-the-hood/`).

## Leftover work carried over (from `docs/INTERNALS.md` at `5d2087b`)

The Bun entry still never dispatches a mission assignment, assignment guards are missing, `step` still throws, and the timer port is not wired. None of that is a GodotJS blocker.
