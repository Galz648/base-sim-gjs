# S4: Event pop-up

One event. A card, one choice, fatigue changes.

**Scene tree** (`src/scenes/event_popup.tscn`):
```
EventPopup (PanelContainer, script: event_popup)
└── VBoxContainer
    ├── Title (Label)
    ├── Body (Label)
    └── Choice (Button)
```
A `Timer` sits on the root of the scene that shows the popup.

**Steps:**
1. One resource, `src/scripts/event_data.ts`:
   ```ts
   export class EventData extends Resource {
     @exports title: string = '';
     @exports body: string = '';
     @exports fatigue_change: float = 0.1;
   }
   ```
   Make one `.tres` in the Inspector, for example a cold shower that raises fatigue.
2. Popup, `src/scripts/event_popup.ts`:
   ```ts
   import { EventData } from './event_data';

   export class EventPopup extends PanelContainer {
     @onready title_label: Label = this.get_node('VBoxContainer/Title');
     @onready body_label: Label = this.get_node('VBoxContainer/Body');
     @onready choice: Button = this.get_node('VBoxContainer/Choice');

     event: EventData | null = null;

     _ready(): void {
       this.choice.pressed.connect(this.on_choice);
     }

     show_event(event: EventData): void {
       this.event = event;
       this.title_label.text = event.title;
       this.body_label.text = event.body;
     }

     on_choice(): void {
       if (this.event === null || Base.person === null) return;
       Base.person.fatigue = clampf(Base.person.fatigue + this.event.fatigue_change, 0.0, 1.0);
     }
   }
   ```
3. On the timer's `timeout`, `load` that one `.tres` and call `show_event`. Set `Base.person` to the person from S1 first.

**Done when:** the card appears on its own, and the button changes fatigue.

---
Previous: [S3](s3-clock-and-schedule.md) | [Index](README.md) | Next: [S5: Conversation](s5-conversation.md)
