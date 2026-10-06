# P4: Signals

**Build:** `Control` root with one `Button`, one `Label`, and one child `Node` that has a custom signal.

**Important:** connect signals **in code**, not in the editor's Signals tab. The editor adds a handler stub to the `.gd`, and tstogd deletes it on the next conversion, so the connection would break. Code connections survive.

1. Child script, `src/scripts/p04-signals/ping.ts`:
   ```ts
   export class Ping extends Node {
     pinged = gd.signal<[]>();

     ping(): void {
       this.pinged.emit();
     }
   }
   ```
   Attach the generated `scripts/p04-signals/ping.gd` to a child node named `Ping` in `src/scenes/p04-signals/p4.tscn`.
2. In `src/scripts/p04-signals/p4.ts`:
   ```ts
   import { Ping } from './ping';

   export class P4 extends Control {
     @onready button: Button = this.get_node('Button');
     @onready label: Label = this.get_node('Label');
     @onready ping: Ping = this.get_node('Ping');

     _ready(): void {
       this.button.pressed.connect(this.on_button);
       this.ping.pinged.connect(this.on_ping);
     }

     on_button(): void {
       this.ping.ping();
     }

     on_ping(): void {
       this.label.text = 'Pinged';
     }
   }
   ```
3. Rule to follow: **call down, signal up.** A parent calls methods on its children. A child never reaches up to its parent. It emits a signal.

**Learn:** a built-in signal (`Button.pressed`), connecting in code, a custom signal with `gd.signal<[...]>() ` and `emit`, why the editor's Signals tab is off limits here.
**Done when:** the button updates the label through the child signal, and no child script calls `get_parent()`.

---
Previous: [P3](p03-first-script-logic.md) | [Index](README.md) | Next: [P5: UI playground](p05-ui-playground.md)
