# S1: Person card

One person. A name, one fatigue bar, one button that rests them.

**Scene tree** (`src/scenes/s1.tscn`):
```
S1 (Control)
└── Card (PanelContainer, script: person_card)
    └── VBoxContainer
        ├── NameLabel (Label)
        ├── FatigueBar (ProgressBar)
        └── RestButton (Button)
```

**Steps:**
1. Create `src/scripts/person.ts` as shown in [the rules](README.md#one-person-one-clock). Make one `.tres` in the Inspector, for example "Dana" with `fatigue = 0.6`.
2. Write `src/scripts/person_card.ts`:
   ```ts
   import { Person } from './person';

   export class PersonCard extends PanelContainer {
     @onready name_label: Label = this.get_node('VBoxContainer/NameLabel');
     @onready bar: ProgressBar = this.get_node('VBoxContainer/FatigueBar');
     @onready rest: Button = this.get_node('VBoxContainer/RestButton');

     person: Person | null = null;

     _ready(): void {
       this.rest.pressed.connect(this.on_rest);
     }

     show_person(p: Person): void {
       this.person = p;
       this.name_label.text = p.display_name;
       this.refresh();
     }

     on_rest(): void {
       if (this.person === null) return;
       this.person.fatigue = clampf(this.person.fatigue - 0.3, 0.0, 1.0);
       this.refresh();
     }

     refresh(): void {
       if (this.person === null) return;
       const t = this.create_tween();
       t.tween_property(this.bar, 'value', this.person.fatigue * 100.0, 0.3);
     }
   }
   ```
3. Call `show_person` from the root `_ready()` with the `.tres` you made.

**Done when:** the name shows, and Rest moves the one bar smoothly.

---
[Index](README.md) | Next: [S2: Base map](s2-base-map.md)
