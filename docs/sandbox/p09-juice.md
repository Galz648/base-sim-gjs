# P9: Juice

**Build:** one button, one bar, one slider, one rectangle.
1. Scene tree: `Control` root, then one `Button`, one `ProgressBar`, one `HSlider`, one `ColorRect`.
2. In `src/scripts/p9.ts`:
   ```ts
   export class P9 extends Control {
     @onready button: Button = this.get_node('Button');
     @onready bar: ProgressBar = this.get_node('ProgressBar');
     @onready slider: HSlider = this.get_node('HSlider');
     @onready rect: ColorRect = this.get_node('ColorRect');

     _ready(): void {
       this.button.pressed.connect(this.on_button);
       this.slider.value_changed.connect(this.on_slider);
     }

     on_button(): void {
       const tween = this.create_tween();
       tween.tween_property(this.bar, 'value', 80.0, 0.4);
     }

     on_slider(v: float): void {
       this.rect.color = Color.BLUE.lerp(Color.RED, v);
     }
   }
   ```
3. On the tween, try `tween.set_trans(Tween.TRANS_CUBIC)` and `tween.set_ease(Tween.EASE_OUT)`.

**Learn:** `Tween` from TypeScript, `tween_property`, `Color.lerp`.
**Done when:** the button moves the bar smoothly, and the slider shifts the rectangle from blue to red.

Shaders are not here on purpose. They get their own page: [P10](p10-shaders.md).

---
Previous: [P8: Shared state and data](p08-shared-state-and-data.md) | [Index](README.md) | Next: [P10: Shaders](p10-shaders.md)
