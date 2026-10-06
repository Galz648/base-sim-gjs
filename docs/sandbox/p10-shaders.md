# P10: Shaders (standalone)

A page on its own. Not needed for the sketches. Do it when you want a color that a slider can drive.

Godot's shader language looks like GLSL. A `canvas_item` shader runs once per pixel of a 2D node. You only write `fragment()`. Built-ins you will use: `UV` (0–1 position across the node) and `COLOR` (the output pixel).

One scene: a `ColorRect` with a `ShaderMaterial` (Inspector > Material > New ShaderMaterial > Shader > New Shader). One `HSlider` next to it.

**Step 1: Hello shader.**
```
shader_type canvas_item;
void fragment() {
    COLOR = vec4(UV.x, UV.y, 0.5, 1.0);
}
```
You should see a gradient across the rect. Change the numbers and watch it update live.

**Step 2: A uniform, driven by the slider.**
```
shader_type canvas_item;
uniform float heat : hint_range(0.0, 1.0) = 0.0;
void fragment() {
    COLOR = mix(vec4(0.2, 0.4, 1.0, 1.0), vec4(1.0, 0.3, 0.1, 1.0), heat);
}
```
The uniform shows up in the Inspector under Shader Parameters. Drag it. Then drive it from the slider:

```ts
export class P10 extends Control {
  @onready slider: HSlider = this.get_node('HSlider');
  @onready rect: ColorRect = this.get_node('ColorRect');

  _ready(): void {
    this.slider.value_changed.connect(this.on_slider);
  }

  on_slider(v: float): void {
    this.rect.material.set_shader_parameter('heat', v);
  }
}
```

Set the slider's max to `1.0` so `v` matches the uniform range.

**Learn:** `ShaderMaterial`, `fragment()`, `UV`, `COLOR`, one uniform, `set_shader_parameter`, `mix`.
**Done when:** the slider changes the rect from blue to orange.

---
Previous: [P9: Juice](p09-juice.md) | [Index](README.md) | Next: [Game sketches](../scenes/README.md)
