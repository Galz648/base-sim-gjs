# S5: Conversation

One button. One line that types out.

**Scene tree** (`src/scenes/s5.tscn`):
```
S5 (Control)
├── Talk (Button)
└── Line (RichTextLabel)
```

**Steps:**
1. In `src/scripts/s5.ts`:
   ```ts
   export class S5 extends Control {
     @onready talk: Button = this.get_node('Talk');
     @onready line: RichTextLabel = this.get_node('Line');

     _ready(): void {
       this.talk.pressed.connect(this.on_talk);
     }

     on_talk(): void {
       const text: string = 'The watch was too long.';
       this.line.text = text;
       this.line.visible_ratio = 0.0;
       const tween = this.create_tween();
       tween.tween_property(this.line, 'visible_ratio', 1.0, text.length() * 0.03);
     }
   }
   ```
   (`text.length()` is GDScript's `String.length()`. Convert once and read the `.gd`.)

**Done when:** Talk types the line out instead of showing it all at once.

---
Previous: [S4](s4-event-popups.md) | [Index](README.md) | Next: [S6: Border watch](s6-border-watch.md)
