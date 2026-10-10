import { Button, Control, Label, PackedScene, ResourceLoader, Signal, VBoxContainer } from "godot";
import { gd } from "../lib/gd";
import type { AliveSoldierState, AvailableMission } from "../lib/sim/domain";
import type SoldierWidget from "./soldier-widget";

const SOLDIER_SCENE = "res://src/scenes/soldier-widget.tscn";

export type DetailData = {
  mission: AvailableMission;
  roster: AliveSoldierState[];
  pickedIds: number[];
};

@gd.class
export default class MissionDetail extends Control {
  widgets: SoldierWidget[] = [];
  packed: PackedScene<SoldierWidget> | null = null;
  @gd.onready("Card/VBox/Title") accessor title_label!: Label;
  @gd.onready("Card/VBox/Body") accessor body_label!: Label;
  @gd.onready("Card/VBox/Roster") accessor roster_box!: VBoxContainer;
  @gd.onready("Card/VBox/Assign") accessor assign!: Button;
  @gd.onready("Card/VBox/Close") accessor close!: Button;
  @gd.signal() accessor mission_closed!: Signal<() => void>;
  @gd.signal() accessor soldier_toggled!: Signal<(soldierId: number) => void>;
  @gd.signal() accessor assign_pressed!: Signal<() => void>;

  _ready(): void {
    this.visible = false;
    this.close.pressed.connect(() => this.mission_closed.emit());
    this.assign.pressed.connect(() => this.assign_pressed.emit());
  }

  sync(data: DetailData | null): void {
    this.clearRoster();
    if (!data) {
      this.visible = false;
      return;
    }
    const { mission, roster, pickedIds } = data;
    this.title_label.text = mission.name;
    this.body_label.text = `${mission.requiredSolders} needed  ·  ${mission.duration}h`;
    this.assign.text = `Assign (${pickedIds.length}/${mission.requiredSolders})`;
    this.assign.disabled = pickedIds.length < mission.requiredSolders;
    for (const soldier of roster) {
      const widget = this.makeWidget();
      widget.sync({ soldier, picked: pickedIds.includes(soldier.id) });
      this.roster_box.add_child(widget);
      widget.soldier_toggled.connect((id) => this.soldier_toggled.emit(id));
      this.widgets.push(widget);
    }
    this.visible = true;
  }

  clearRoster(): void {
    for (const widget of this.widgets) {
      this.roster_box.remove_child(widget);
      widget.queue_free();
    }
    this.widgets = [];
  }

  makeWidget(): SoldierWidget {
    this.packed ??= ResourceLoader.load(SOLDIER_SCENE) as PackedScene<SoldierWidget>;
    return this.packed.instantiate();
  }
}
