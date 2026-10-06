# P0: tstogd setup

Scripts in this plan are TypeScript. [tstogd](https://github.com/nnn3d/typescript-to-gdscript) converts them to `.gd` files, and Godot runs those as usual. Do this once, before P1.

## How the pieces fit

```
sandbox/                      your Godot project
├── project.godot
├── tstogd.json               converter config (created by `tstogd init`)
├── tsconfig.json
├── package.json
├── src/
│   ├── scenes/               .tscn files
│   │   └── ball.tscn
│   └── scripts/              TypeScript you write
│       └── ball.ts
├── scripts/                  GENERATED .gd files (do not edit)
│   └── ball.gd
└── node_modules/typescript-to-gdscript/
```

`tstogd.json` points `tsDir` at `src/scripts` and `gdDir` at `scripts`. Edit the `.ts`, never the `.gd`. Godot attaches the generated `.gd` to nodes. Scenes live in `src/scenes`.

## Steps

1. **Create the project.** In the `sandbox/` folder, make a Godot project (see the [main README](../../README.md)).
2. **Install.** In a terminal inside `sandbox/`:
   ```
   npm install --save-dev typescript-to-gdscript
   npx tstogd init
   ```
   You need Node.js 22+.
3. **Write a script.** Create `src/scripts/hello.ts`:
   ```ts
   export class Hello extends Node2D {
     _ready(): void {
       print('hello from TypeScript');
     }
   }
   ```
4. **Convert.** Run `npx tstogd watch` in a terminal and leave it running. Every save converts the file, and it also keeps the Godot typings in sync with your scenes and assets.
5. **Open the generated file.** Find `hello.gd`. Read it. Compare it with your `.ts`. Do this often. It is the fastest way to learn what a TypeScript construct turns into.
6. **Attach it.** In Godot, make a `Node2D`, attach `hello.gd` (the generated file, not the `.ts`), and press F5. The output panel prints your line.

## The workflow, every time

1. Keep `npx tstogd watch` running.
2. Edit `.ts` files, save, and wait for the converter.
3. In Godot, build scenes and attach the generated `.gd` files. If Godot asks to reload a changed script, say yes.
4. Run the scene (F5).

## Editor setup (Cursor / VS Code)

- Open the folder that holds `tsconfig.json` (here, `sandbox/`) as the workspace root.
- Run "TypeScript: Select TypeScript Version" and pick **Use Workspace Version**. The converter's editor plugin only loads with the workspace TypeScript.
- Run "TypeScript: Restart TS Server" after installing or changing config.
- Keep your scripts in `src/scripts/`. A `.ts` file elsewhere gets no Godot types, and you see errors like `Cannot find name 'CharacterBody2D'`.
- To check which config covers a file, run "TypeScript: Go to Project Configuration".

## Rules to remember

- Never edit the generated `.gd` files. Your changes are overwritten.
- **Do not connect signals in the editor** (Node dock > Signals tab). The editor adds a handler stub to the `.gd`, and tstogd deletes it on the next conversion. Connect signals in code, as shown in [P4](p04-signals.md).
- Names follow Godot's API: `move_and_slide()`, `get_viewport_rect()`, `append`, not JavaScript's `push`.
- When something doesn't convert, the error shows in the editor (and in `tstogd convert`). The tstogd docs have a [caveats page](https://nnn3d.github.io/typescript-to-gdscript/guide/caveats/) listing what GDScript can't express.

**Learn:** the `src` to `.gd` pipeline, `tstogd watch`, the editor setup, attaching generated scripts.
**Done when:** you edit `hello.ts`, save, see `hello.gd` update, and the changed message prints in Godot.

---
[Index](README.md) | Next: [P1: Editor tour](p01-editor-tour.md)
