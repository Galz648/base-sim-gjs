# P6: Move a character

**Build:** one `CharacterBody2D` player and one `StaticBody2D` wall.
1. Player: `CharacterBody2D` > `Sprite2D` + `CollisionShape2D` (a `RectangleShape2D` the size of the sprite).
2. Project Settings > Input Map: add actions `move_left`, `move_right`, `move_up`, `move_down` (bind WASD and arrows).
3. In `src/scripts/p06-move-a-character/player.ts`, attach the generated `scripts/p06-move-a-character/player.gd` to the player in `src/scenes/p06-move-a-character/p6.tscn`:
   ```ts
   export class Player extends CharacterBody2D {
     @exports speed: float = 120.0;

     _physics_process(delta: float): void {
       const direction: Vector2 = Input.get_vector('move_left', 'move_right', 'move_up', 'move_down');
       this.velocity = gd.ops.mul(direction, this.speed);
       this.move_and_slide();
     }
   }
   ```
4. One wall: a `StaticBody2D` with a `CollisionShape2D` and a `ColorRect` so you can see it.
5. Change `speed` in the Inspector (it is exported) while the game runs, and watch the effect.

**Learn:** `CharacterBody2D`, one collision shape, `move_and_slide()`, Input Map actions, `_physics_process`, `@exports`.
**Done when:** the player moves and stops against the one wall.

---
Previous: [P5](p05-ui-playground.md) | [Index](README.md) | Next: [P7: Tilemap, camera, pickup, HUD](p07-tilemap-camera-pickup-hud.md)
