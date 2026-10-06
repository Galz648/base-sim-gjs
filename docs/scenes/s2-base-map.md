# S2: Base map

One person walks to one place.

**Scene tree** (`src/scenes/s2.tscn`):
```
S2 (Node2D)
├── Floor (ColorRect)
├── Place (Marker2D)
└── Person (CharacterBody2D, script: person_body)
    ├── Sprite2D
    └── CollisionShape2D
```

**Steps:**
1. Write `src/scripts/person_body.ts`:
   ```ts
   export class PersonBody extends CharacterBody2D {
     target: Vector2 = Vector2.ZERO;
     moving: bool = false;

     go_to(target: Vector2): void {
       this.target = target;
       this.moving = true;
     }

     _physics_process(delta: float): void {
       if (!this.moving) return;
       if (this.global_position.distance_to(this.target) < 4.0) {
         this.moving = false;
         return;
       }
       this.velocity = gd.ops.mul(this.global_position.direction_to(this.target), 60.0);
       this.move_and_slide();
     }
   }
   ```
2. In `src/scripts/s2.ts`, on `_ready()`, call `go_to` with the marker's `global_position`.

**Done when:** the person walks to the marker and stops.

---
Previous: [S1](s1-person-card.md) | [Index](README.md) | Next: [S3: Clock and schedule](s3-clock-and-schedule.md)
