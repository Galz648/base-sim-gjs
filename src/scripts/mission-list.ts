import { PackedScene, ResourceLoader, Signal, VBoxContainer } from "godot";
import { gd } from "../lib/gd";
import type { AvailableMission } from "../lib/sim/domain";
import type MissionWidget from "./mission-widget";

const WIDGET_SCENE = "res://src/scenes/mission-widget.tscn";

@gd.class
export default class MissionList extends VBoxContainer {
  widgets: MissionWidget[] = [];
  packed: PackedScene<MissionWidget> | null = null;
  @gd.signal() accessor mission_picked!: Signal<(missionId: number) => void>;

  sync(missions: AvailableMission[]): void {
    for (const widget of this.widgets) {
      this.remove_child(widget);
      widget.queue_free();
    }
    this.widgets = [];
    for (const mission of missions) {
      const widget = this.makeWidget();
      widget.sync(mission);
      this.add_child(widget);
      widget.mission_picked.connect((id) => this.mission_picked.emit(id));
      this.widgets.push(widget);
    }
  }

  makeWidget(): MissionWidget {
    this.packed ??= ResourceLoader.load(WIDGET_SCENE) as PackedScene<MissionWidget>;
    return this.packed.instantiate();
  }
}
