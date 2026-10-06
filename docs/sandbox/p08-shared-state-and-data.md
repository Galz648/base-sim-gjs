# P8: Shared state and data

**Build:** one coin count shared by two scenes. Each scene is one `Button` and one `Label`.
1. Create `src/scripts/game_state.ts`:
   ```ts
   export class GameState extends Node {
     coins: int = 0;
     coins_changed = gd.signal<[value: int]>();

     add_coin(): void {
       this.coins += 1;
       this.coins_changed.emit(this.coins);
     }
   }
   ```
   Register the generated `game_state.gd` in Project Settings > Globals > Autoload with the name `GameState`. If the editor doesn't know the global yet, keep `tstogd watch` running so the typings refresh.
2. `src/scenes/scene_a.tscn`: one `Button`, one `Label`. The button adds a coin, then switches scene. In `src/scripts/scene_a.ts`:
   ```ts
   export class SceneA extends Control {
     @onready button: Button = this.get_node('Button');
     @onready label: Label = this.get_node('Label');

     _ready(): void {
       this.button.pressed.connect(this.on_pressed);
       this.label.text = `${GameState.coins}`;
     }

     on_pressed(): void {
       GameState.add_coin();
       this.get_tree().change_scene_to_file('res://src/scenes/scene_b.tscn');
     }
   }
   ```
3. `src/scenes/scene_b.tscn` is the same tree: one `Button`, one `Label`. In `_ready()`, set the label from `GameState.coins`. The button switches back with `change_scene_to_file('res://src/scenes/scene_a.tscn')`. The count must survive the switch.
4. **One custom resource.** `src/scripts/level_data.ts`:
   ```ts
   export class LevelData extends Resource {
     @exports title: string = '';
   }
   ```
   After conversion: FileSystem > right-click > New Resource > `LevelData`, and save `level1.tres`. Load it with `const level = load('res://level1.tres');` and print `level.title`.
5. **Save and load.** One `ConfigFile` so the count survives a restart:
   ```ts
   const cfg = new ConfigFile();
   cfg.set_value('progress', 'coins', GameState.coins);
   cfg.save('user://save.cfg');
   ```
   On start, `cfg.load('user://save.cfg')` and `cfg.get_value('progress', 'coins', 0)`. (If `new ConfigFile()` surprises you, read the generated `.gd` to see what it became.)

**Learn:** an autoload, `change_scene_to_file`, a custom `Resource` with one `@exports` field, `ConfigFile`, the `user://` path.
**Done when:** the coin count survives a scene switch and a full restart, and you edited `level1.tres` in the Inspector without touching code.

---
Previous: [P7](p07-tilemap-camera-pickup-hud.md) | [Index](README.md) | Next: [P9: Juice](p09-juice.md)
