import { Button, Control, Label, Signal } from "godot";
import { gd } from "../lib/gd";
import type { AvailableMission } from "../lib/sim/domain";

@gd.class
export default class MissionDetail extends Control {
  @gd.onready("Card/VBox/Title") accessor title_label!: Label;
  @gd.onready("Card/VBox/Body") accessor body_label!: Label;
  @gd.onready("Card/VBox/Close") accessor close!: Button;
  @gd.signal() accessor mission_closed!: Signal<() => void>;

  _ready(): void {
    this.visible = false;
    this.close.pressed.connect(() => this.mission_closed.emit());
  }

  sync(mission: AvailableMission | null): void {
    if (!mission) {
      this.visible = false;
      return;
    }
    this.title_label.text = mission.name;
    this.body_label.text = `${mission.requiredSolders} needed  ·  ${mission.duration}h`;
    this.visible = true;
  }
}
