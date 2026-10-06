# P1: Editor tour

**Build:** `Node2D` (root) with one child `Label`, and a script that moves the label. The project main scene stays `src/scenes/main.tscn`. This example lives in its own folder. Hook it up by instancing it under Main.
1. Create a `Node2D` root and a child `Label`. Set its text in the Inspector. Save as `src/scenes/p01-editor-tour/p1.tscn`.
2. Open `src/scenes/main.tscn` and instance `p1.tscn` as a child of Main. Press F5. F6 runs the example scene by itself.
3. In `src/scripts/p01-editor-tour/p1.ts`:
   ```ts
   export class P1 extends Node2D {
     @onready label: Label = this.get_node('Label');

     _process(delta: float): void {
       this.label.position.x += delta * 60.0;
       const width: float = this.get_viewport_rect().size.x;
       if (this.label.position.x > width) this.label.position.x = 0.0;
     }
   }
   ```
   With `npx tstogd watch` running, attach the generated `scripts/p01-editor-tour/p1.gd` to the root node (right-click > Attach Script, or drag it onto the node).

**Learn:** the Scene, Inspector, FileSystem and Node panels, the node tree, running a scene (F5) versus the main scene (F6 for the current scene), and the `.ts` to `.gd` round trip.
**Done when:** the label scrolls and wraps, and you can name which panel you used for each step.

---
Previous: [P0: tstogd setup](p00-tstogd-setup.md) | [Index](README.md) | Next: [P2: Scenes as building blocks](p02-scenes-as-building-blocks.md)
