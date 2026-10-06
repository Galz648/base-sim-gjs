# P2: Scenes as building blocks

**Build:** `src/scenes/p02-scenes-as-building-blocks/ball.tscn` (`Node2D` > `Sprite2D`) and `p2.tscn` in that same folder, which instances the ball once in the editor and once from code. Hook `p2.tscn` under `src/scenes/main.tscn` to run it. Global `main.ts` stays empty.
1. Make `ball.tscn` with a `Sprite2D` using the editor icon as texture. Write `src/scripts/p02-scenes-as-building-blocks/ball.ts` and attach the generated `scripts/p02-scenes-as-building-blocks/ball.gd` to the root:
   ```ts
   export class Ball extends Node2D {
     velocity: Vector2 = Vector2(80.0, 60.0);

     _process(delta: float): void {
       this.position = gd.ops.add(this.position, gd.ops.mul(this.velocity, delta));
       const size: Vector2 = this.get_viewport_rect().size;
       if (this.position.x < 0.0 || this.position.x > size.x) this.velocity.x = -this.velocity.x;
       if (this.position.y < 0.0 || this.position.y > size.y) this.velocity.y = -this.velocity.y;
     }
   }
   ```
2. In `src/scenes/p02-scenes-as-building-blocks/p2.tscn`, drag `ball.tscn` in once (instancing in the editor).
3. Spawn one more from code. In `src/scripts/p02-scenes-as-building-blocks/p2.ts`:
   ```ts
   import { Ball } from './ball';

   export class Main extends Node2D {
     _ready(): void {
       const ball = gd.as(preload('res://src/scenes/p02-scenes-as-building-blocks/ball.tscn').instantiate(), Ball);
       if (ball === null) return;
       ball.position = Vector2(200.0, 150.0);
       this.add_child(ball);
     }
   }
   ```
   (Imports use the TypeScript path, like `./ball`. The preload path is the Godot path.)

**Learn:** saving a branch as a scene, instancing in the editor and in code, `_ready()` versus `_process()`, `gd.as` for typed nodes, vector maths with `gd.ops`.
**Done when:** one editor-placed ball and one code-spawned ball bounce on their own.

---
Previous: [P1](p01-editor-tour.md) | [Index](README.md) | Next: [P3: Your first script logic](p03-first-script-logic.md)
