# Godot components (P0–P10)

Step 1 of the plan. Small throwaway scenes, one idea each. No game. Each scene has one of each node: one button, one label, one wall. Build it in the `sandbox/` project and move on when you can rebuild it from memory. All scripts are TypeScript compiled by tstogd. The [cheat sheet](tstogd-cheatsheet.md) shows how GDScript constructs look in it.

Each example gets a folder: `src/scenes/p01-editor-tour/` and `src/scripts/p01-editor-tour/`. `src/scenes/main.tscn` stays the run scene. Instance the example under Main when you want to play it. P1 through P6 are set up that way. P7 onward still uses the flat paths.

Project settings to set once, in Project > Project Settings:
- Display > Window > Stretch > Mode: `canvas_items`, Aspect: `keep`.
- Rendering > Textures > Canvas Textures > Default Texture Filter: `Nearest` (for pixel art).

**Exit check:** you can tween one bar from a button, walk a character into one wall, and keep one number in an autoload across a scene change. Scripts are TypeScript you wrote and converted yourself.

0. [P0: tstogd setup](p00-tstogd-setup.md)
1. [P1: Editor tour](p01-editor-tour.md)
2. [P2: Scenes as building blocks](p02-scenes-as-building-blocks.md)
3. [P3: Your first script logic](p03-first-script-logic.md)
4. [P4: Signals](p04-signals.md)
5. [P5: UI playground](p05-ui-playground.md)
6. [P6: Move a character](p06-move-a-character.md)
7. [P7: Tilemap, camera, pickup, HUD](p07-tilemap-camera-pickup-hud.md)
8. [P8: Shared state and data](p08-shared-state-and-data.md)
9. [P9: Juice](p09-juice.md)
10. [P10: Shaders](p10-shaders.md) (standalone, optional for the sketches; shaders are written in Godot's shader language, not TypeScript)

Reference: [tstogd cheat sheet](tstogd-cheatsheet.md)

Next: [Game sketches](../scenes/README.md)
