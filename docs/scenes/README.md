# Game sketches (S1–S7)

Step 2 of the plan. Small playable scenes. **No deep simulation.** One person, one number, one of each node. All scripts are TypeScript in `src/scripts/`. Scenes go in `src/scenes/`. Keep `npx tstogd watch` running.

## One person, one clock

Create these once (see [P8](../sandbox/p08-shared-state-and-data.md)).

**`src/scripts/person.ts`**, a `Resource`:

```ts
export class Person extends Resource {
  @exports display_name: string = '';
  @export_range(0, 1) fatigue: float = 0.2;
}
```

**`src/scripts/base.ts`**, an autoload registered as `Base`:

```ts
import { Person } from './person';

export class Base extends Node {
  person: Person | null = null;
  hour: float = 6.0;
  hour_changed = gd.signal<[hour: float]>();

  _process(delta: float): void {
    this.hour = fmod(this.hour + delta, 24.0);
    this.hour_changed.emit(this.hour);
  }
}
```

Rules:

- **Time** advances in `Base._process` and wraps at 24.
- **Fatigue** is the only stat. A button or a choice adds or subtracts a fixed amount, clamped to 0–1.
- When a number changes, tween it. One tween is enough.

## Sketches

1. [S1: Person card](s1-person-card.md): a name, one bar, one button.
2. [S2: Base map](s2-base-map.md): one person walks to one marker.
3. [S3: Clock and schedule](s3-clock-and-schedule.md): a clock and one drop slot.
4. [S4: Event pop-up](s4-event-popups.md): one event, one choice.
5. [S5: Conversation](s5-conversation.md): one button, one typed line.
6. [S6: Border watch](s6-border-watch.md): one sweep, one walker.
7. [S7: A day](s7-day-loop.md): the clock runs, then the day ends.

Suggested order: S1, then the rest. S1–S3 need P0–P8.

[Back to README](../../README.md)
