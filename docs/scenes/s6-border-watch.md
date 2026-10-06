# S6: Border watch

One sweep. One walker. A tired guard (high fatigue) notices slower.

**Scene tree** (`src/scenes/s6.tscn`):
```
S6 (Node2D, script: watch)
├── Path (Path2D)
│   └── Walker (PathFollow2D)
│       └── Body (Area2D)
│           ├── Sprite2D
│           └── CollisionShape2D
├── Sweep (Node2D)
│   ├── ColorRect
│   └── Cone (Area2D)
│       └── CollisionShape2D
└── Notice (Timer)
```
Two `Area2D` nodes: one is the light, one is the walker. `area_entered` only fires between areas.

**Steps:**
1. Set `Base.person` to the person from S1 so fatigue has a value.
2. Write `src/scripts/watch.ts`:
   ```ts
   export class Watch extends Node2D {
     @onready sweep: Node2D = this.get_node('Sweep');
     @onready walker: PathFollow2D = this.get_node('Path/Walker');
     @onready notice: Timer = this.get_node('Notice');
     @onready cone: Area2D = this.get_node('Sweep/Cone');

     caught: bool = false;

     _ready(): void {
       const t = this.create_tween();
       t.set_loops();
       t.tween_property(this.sweep, 'rotation', 0.6, 4.0);
       t.tween_property(this.sweep, 'rotation', -0.6, 4.0);
       this.cone.area_entered.connect(this.on_area_entered);
       this.notice.timeout.connect(this.on_notice);
       this.notice.one_shot = true;
     }

     on_area_entered(_area: Area2D): void {
       const fatigue: float = Base.person === null ? 0.0 : Base.person.fatigue;
       this.notice.wait_time = lerpf(0.4, 2.5, fatigue);
       this.notice.start();
     }

     on_notice(): void {
       this.caught = true;
     }

     _process(delta: float): void {
       if (this.caught) return;
       this.walker.progress += 40.0 * delta;
     }
   }
   ```

**Done when:** the bar sweeps, the walker moves, and a rested guard stops it sooner than a tired one.

---
Previous: [S5](s5-conversation.md) | [Index](README.md) | Next: [S7: A day](s7-day-loop.md)
