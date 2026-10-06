# P7: Tilemap, camera, pickup, HUD

**Build:** one tiled room, one camera, one pickup, one label. Reuse the player from [P6](p06-move-a-character.md).
1. Add one `TileMapLayer`. In the Inspector create a new `TileSet` (set the tile size, for example 16×16). Open the TileSet bottom panel and drag in a tileset image.
2. In the TileSet, add one **Physics Layer**. Select the wall tile and draw a collision polygon on it (Paint mode > Physics Layer 0).
3. Paint a floor and a few wall tiles. Those wall tiles should block the player.
4. Add one `Camera2D` as a child of the player. Turn on `position_smoothing_enabled`.
5. One pickup: `Area2D` > `CollisionShape2D` + `Sprite2D`. Add the player to a group named `player` (Node dock > Groups, or `add_to_group('player')` in the player's `_ready()`). In `src/scripts/pickup.ts`:
   ```ts
   export class Pickup extends Area2D {
     picked = gd.signal<[]>();

     _ready(): void {
       this.body_entered.connect(this.on_body_entered);
     }

     on_body_entered(body: Node2D): void {
       if (!body.is_in_group('player')) return;
       this.picked.emit();
       this.queue_free();
     }
   }
   ```
6. HUD: one `CanvasLayer` with one `Label` inside. It stays fixed on screen while the camera moves. In the room script, connect that one pickup:
   ```ts
   import { Pickup } from './pickup';

   export class Room extends Node2D {
     @onready pickup: Pickup = this.get_node('Pickup');
     @onready label: Label = this.get_node('HUD/Label');

     _ready(): void {
       this.pickup.picked.connect(this.on_picked);
     }

     on_picked(): void {
       this.label.text = 'Got it';
     }
   }
   ```

**Learn:** `TileSet`, `TileMapLayer`, tile physics, `Camera2D`, `Area2D`, `body_entered`, `CanvasLayer`.
**Done when:** the camera follows, tile walls block you, the one pickup disappears, and the label changes.

---
Previous: [P6](p06-move-a-character.md) | [Index](README.md) | Next: [P8: Shared state and data](p08-shared-state-and-data.md)
