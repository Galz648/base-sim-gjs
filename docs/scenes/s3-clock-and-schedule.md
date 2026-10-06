# S3: Clock and schedule

A clock, one activity you drag, one slot you drop it on.

**Scene tree** (`src/scenes/s3.tscn`):
```
S3 (Control)
├── ClockLabel (Label)
├── Activity (Button, script: activity)
└── Slot (Label, script: slot)
```

**Steps:**
1. Clock. In `src/scripts/s3.ts`, connect `Base.hour_changed` and write the hour into `ClockLabel`:
   ```ts
   on_hour(hour: float): void {
     this.clock.text = `${floori(hour)}`;
   }
   ```
2. Drag. `src/scripts/activity.ts` on the button:
   ```ts
   export class Activity extends Button {
     _get_drag_data(_at_position: Vector2): string {
       return 'Rest';
     }
   }
   ```
3. Drop. `src/scripts/slot.ts` on the slot label:
   ```ts
   export class Slot extends Label {
     _can_drop_data(_at_position: Vector2, _data: Variant): bool {
       return true;
     }

     _drop_data(_at_position: Vector2, data: Variant): void {
       this.text = String(data);
     }
   }
   ```

**Done when:** the clock shows the hour, and dropping Rest onto the slot shows that word.

---
Previous: [S2](s2-base-map.md) | [Index](README.md) | Next: [S4: Event pop-up](s4-event-popups.md)
