# P5: UI playground

**Build:** one slider and one label that follow the window. Mostly editor work.
1. Root `Control` with Layout set to Full Rect. One child `VBoxContainer`.
2. Inside the box: one `Label` and one `HSlider`.
3. Select the root `Control`, open the Layout menu, and try one anchor preset (Full Rect). Resize the window and watch the box move with it.
4. Set `size_flags_horizontal` to `Expand + Fill` on the slider.
5. One script so the label follows the slider. Scene: `src/scenes/p05-ui-playground/p5.tscn`. In `src/scripts/p05-ui-playground/p5.ts`:
   ```ts
   export class P5 extends Control {
     @onready slider: HSlider = this.get_node('VBoxContainer/HSlider');
     @onready label: Label = this.get_node('VBoxContainer/Label');

     _ready(): void {
       this.slider.value_changed.connect(this.on_slider);
     }

     on_slider(v: float): void {
       this.label.text = `Volume: ${v}`;
     }
   }
   ```
   (Rename the nodes to match yours. Use the editor's "Copy Node Path" if a path is long.)

**Learn:** one anchor preset, one container, size flags, node paths in `get_node`.
**Done when:** the label and slider stay in the box when you resize the window.

---
Previous: [P4](p04-signals.md) | [Index](README.md) | Next: [P6: Move a character](p06-move-a-character.md)
