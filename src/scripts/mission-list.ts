import { PackedScene, ResourceLoader, Signal, VBoxContainer } from "godot";
import { gd } from "../lib/gd";
import type MissionWidget from "./mission-widget";
import type { MissionRow } from "./mission-widget";

const WIDGET_SCENE = "res://src/scenes/mission-widget.tscn";

@gd.class
export default class MissionList extends VBoxContainer {
  widgets: MissionWidget[] = [];
  packed: PackedScene<MissionWidget> | null = null;
  @gd.signal() accessor mission_picked!: Signal<(missionId: number) => void>;

  sync(rows: MissionRow[]): void {
    for (const widget of this.widgets) {
      this.remove_child(widget);
      widget.queue_free();
    }
    this.widgets = [];
    for (const row of rows) {
      const widget = this.makeWidget();
      widget.sync(row);
      this.add_child(widget);
      if (row.pickable) {
        widget.mission_picked.connect((id) => this.mission_picked.emit(id));
      }
      this.widgets.push(widget);
    }
  }

  makeWidget(): MissionWidget {
    this.packed ??= ResourceLoader.load(WIDGET_SCENE) as PackedScene<MissionWidget>;
    return this.packed.instantiate();
  }
}
