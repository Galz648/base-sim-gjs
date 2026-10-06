# Working on Base Sim day to day

## After cloning

```sh
bun install
bun run types      # generates the full Godot API typings (about 6 MB, gitignored) so Cursor can autocomplete Godot
```

Then in Cursor: **Cmd+Shift+P, "TypeScript: Restart TS Server"**, and accept "Use workspace version" if it asks. The settings in `.vscode/` already point Cursor at the project's own TypeScript.

## Start (two terminals)

```sh
cd /Users/galzafar/dev/base-sim-gjs
bun run dev:build      # terminal 1: rebuilds on save (leave it running)
bun run editor         # terminal 2: the Godot editor (patched build from .env)
```

Edit in Cursor. Press **F5** in the editor to run the game; the board prints in the **Output** panel. To try a change, save, wait about a second, press F5 again (a running game never hot-swaps).

No editor? `bun run dev` rebuilds and relaunches a game window on every save; `bun run bun` runs the sim in Bun only (fastest loop for pure sim logic).

All Godot commands (`start`, `headless`, `editor`, `headless:mapped`, `dev`, `types`) find the GodotJS binary through a config, not a shell export: `GODOTJS` in the shell or in a project `.env`, else the global `~/.config/godotjs/config.json`. Check it with `bun run config`; change it with `bun tools/config.ts set <path>` (it is currently the patched editor build).

## Manual GUI checks to notice while you work

These are the things we could only half-verify without you in the editor. Tick them off as they come up and note what you saw (a line each in `docs/GUI-LOG.md`):

- [ ] **Error click-through:** an error in Output shows `res://src/...ts:LINE`; clicking it opens Cursor on that line. (Worked in the scratch project; confirm on a real error from this project.)
- [ ] **Debugger tab:** the same error in Debugger > Errors; click or double-click it. (Not clicked yet.)
- [ ] **Error text:** the line numbers in the message match the `.ts` file (1-based). Report any off-by-one.
- [ ] **Reload on save:** with `dev:build` running, saving a script updates the editor (open a script and watch for stale views). The `hot_reload` addon should refresh it without you clicking the window.
- [ ] **New scripts / new scenes:** add a script under `src/scripts/`, attach it to a node in the editor, run it. The first build after adding a file picks it up in watch mode; note if it does not.
- [ ] **`@export` in a real script:** add `@bind.export(...)` and see it in the inspector.
- [ ] **Output noise:** note any `[jsb][Error]` lines that are not your own errors (the toolchain files are now hidden from Godot, so there should be none).
- [ ] **Colors:** the board is plain text in the editor; colored only under `bun run bun` in a terminal.

## Gotchas

- Create nodes from a script with `load(path).call("new")` (`new Node()` plus `set_script()` leaves `accessor` fields broken).
- Pure game logic goes in `src/lib/` (Bun inlines it; Godot never loads it as a script). Only files under `src/scripts/` become Godot scripts.
- GDScript globals (`floor`, `clamp`, `print`, `$Node`, `load`/`preload`) have JS forms: see the `godotjs-esm` docs `docs/GDSCRIPT-TO-GODOTJS.md`.
- `SceneTree.paused` does not pause JS timers.
- Editor wrote a header into `project.godot` or created `.uid` files? Harmless (`*.uid` is gitignored).

## If something is off

| Symptom | Try |
|---|---|
| Editor shows old code | is `bun run dev:build` running? check its last line; focus the editor window |
| `no GodotJS binary configured` | `bun tools/config.ts set <path>` (or a project `.env`, see `.env.example`) |
| Errors show `main.js:21746` instead of `src/...` | you are on the stock binary; use the patched one (`.env`) |
| "javascript file is missing" for a game script | the file must be under `src/scripts/` and built (`bun run build`) |
| Weird engine crash on a script | check the script lives under `src/scripts/` and that `.godot/GodotJS/src/scripts/<name>.js` exists |
