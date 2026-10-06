# S7: A day

The clock runs. When the hour passes 22, the day is over.

**Scene tree** (`src/scenes/s7.tscn`):
```
S7 (Control, script: day)
├── ClockLabel (Label)
└── EndLabel (Label)
```

**Steps:**
1. Set `Base.person` to the person from S1.
2. Write `src/scripts/day.ts`:
   ```ts
   export class Day extends Control {
     @onready clock: Label = this.get_node('ClockLabel');
     @onready end_label: Label = this.get_node('EndLabel');

     ended: bool = false;

     _ready(): void {
       Base.hour = 6.0;
       Base.hour_changed.connect(this.on_hour);
     }

     on_hour(hour: float): void {
       if (this.ended) return;
       this.clock.text = `${floori(hour)}`;
       if (hour < 22.0) return;
       this.ended = true;
       const fatigue: float = Base.person === null ? 0.0 : Base.person.fatigue;
       this.end_label.text = `Day over. Fatigue ${fatigue}`;
     }
   }
   ```

**Done when:** the label counts up from 6 and, at 22, shows fatigue and stops.

---
Previous: [S6](s6-border-watch.md) | [Index](README.md)
