# tstogd cheat sheet

How common GDScript constructs look when you write them in TypeScript for tstogd. Keep it open while you work. When unsure, convert and read the generated `.gd`. Full reference: the [tstogd docs](https://nnn3d.github.io/typescript-to-gdscript/).

## A script, side by side

```ts
// src/scripts/player.ts
export class Player extends CharacterBody2D {
  health_changed = gd.signal<[health: int]>();

  @exports speed: float = 200.0;
  health: int = 100;

  _physics_process(delta: float): void {
    const direction: Vector2 = Input.get_vector('move_left', 'move_right', 'move_up', 'move_down');
    this.velocity = gd.ops.mul(direction, this.speed);
    this.move_and_slide();
  }

  async take_damage(amount: int): Promise<void> {
    this.health -= amount;
    this.health_changed.emit(this.health);
    await this.get_tree().create_timer(0.2).timeout;
  }
}
```

becomes roughly:

```gdscript
class_name Player
extends CharacterBody2D

signal health_changed(health: int)
@export
var speed: float = 200.0
var health: int = 100

func _physics_process(delta: float):
	var direction = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	self.velocity = (direction * self.speed)
	self.move_and_slide()

func take_damage(amount: int):
	self.health -= amount
	self.health_changed.emit(self.health)
	await self.get_tree().create_timer(0.2).timeout
```

## Mapping

| You want | GDScript | TypeScript (tstogd) |
|----------|----------|---------------------|
| Script on a node | `extends Node2D` | `export class Name extends Node2D { ... }` (the class name becomes `class_name`) |
| Field | `var health: int = 100` | `health: int = 100;` |
| Number types | `int`, `float` | `int`, `float` (not `number`) |
| Exported field | `@export var speed: float = 200.0` | `@exports speed: float = 200.0;` (note the plural) |
| Export with range | `@export_range(0, 1) var x := 0.2` | `@export_range(0, 1) x: float = 0.2;` |
| Child node | `@onready var label: Label = $Label` | `@onready label: Label = this.get_node('Label');` |
| Own members | `self.x`, or just `x` | always `this.x` |
| Lifecycle | `func _ready():` | `_ready(): void { }` |
| Per frame | `func _process(delta):` | `_process(delta: float): void { }` |
| Physics frame | `func _physics_process(delta):` | `_physics_process(delta: float): void { }` |
| Signal | `signal done(value: int)` | `done = gd.signal<[value: int]>();` |
| Emit | `done.emit(5)` | `this.done.emit(5);` |
| Connect | `button.pressed.connect(_on_pressed)` | `this.button.pressed.connect(this.on_pressed);` |
| Vector, color | `Vector2(1, 2)`, `Color.RED` | `Vector2(1.0, 2.0)`, `Color.RED` (no `new` for built-ins) |
| Vector maths | `a * 2.0`, `a + b` | `gd.ops.mul(a, 2.0)`, `gd.ops.add(a, b)` (also `sub`, `div`) |
| Cast a node | `child as Coin` | `gd.as(child, Coin)` (null if it isn't one) |
| Type check | `x is Coin` | `gd.is(x, Coin)` |
| Wait | `await get_tree().create_timer(1.0).timeout` | `await this.get_tree().create_timer(1.0).timeout;` (mark the method `async`) |
| Loop children | `for c in get_children():` | `for (const c of this.get_children()) { }` |
| String format | `"Score %d" % score` | `` `Score ${this.score}` `` |
| Typed array | `Array[int]` | `Array<int>` |
| Add to array | `a.append(x)` | `a.append(x)` (Godot's name, not `push`) |
| Random | `randf_range(0, 1)` | `randf_range(0.0, 1.0)` |
| Scene preload | `preload("res://src/scenes/ball.tscn")` | `preload('res://src/scenes/ball.tscn')` (typed from your project) |
| Instance | `scene.instantiate()` | `scene.instantiate()` |
| Change scene | `get_tree().change_scene_to_file(p)` | `this.get_tree().change_scene_to_file(p);` |
| Group | `add_to_group("balls")` | `this.add_to_group('balls');` |

## Resources (data files)

```ts
// src/scripts/person.ts
export class Person extends Resource {
  @exports display_name: string = '';
  @export_range(0, 1) hunger: float = 0.2;
  @export_range(0, 1) fatigue: float = 0.2;
  @export_range(0, 1) discipline: float = 0.8;
}
```

Convert it, then in Godot: FileSystem > right-click > New Resource > `Person`, and fill the fields in the Inspector.

## Autoloads (global singletons)

```ts
// src/scripts/game_state.ts
export class GameState extends Node {
  coins: int = 0;
  coins_changed = gd.signal<[value: int]>();

  add_coin(): void {
    this.coins += 1;
    this.coins_changed.emit(this.coins);
  }
}
```

Register the generated `.gd` in Project Settings > Globals > Autoload. If the editor doesn't know the global yet, keep `tstogd watch` running so the typings refresh.

## Habits that save time

- Keep `npx tstogd watch` running.
- Read the generated `.gd` when a construct surprises you.
- Never edit `.gd`. Never connect signals in the editor ([why](p00-tstogd-setup.md#rules-to-remember)).
- If Cursor says `Cannot find name 'SomeGodotClass'`: the file is outside `tsconfig.json`'s `include`, or the workspace TypeScript isn't selected. See [P0](p00-tstogd-setup.md#editor-setup-cursor--vs-code).
- Anything GDScript-only (match patterns, getters and setters, raw GDScript) lives under the `gd` namespace. See the tstogd [`gd` helpers reference](https://nnn3d.github.io/typescript-to-gdscript/reference/gd-helpers/).

---
[Index](README.md)
