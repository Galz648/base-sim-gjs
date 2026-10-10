import { Button, Signal } from "godot";
import { gd } from "../lib/gd";

export type MissionRow = {
  id: number;
  text: string;
  pickable: boolean;
};

@gd.class
export default class MissionWidget extends Button {
  missionId: number | null = null;
  pickable = false;
  @gd.signal() accessor mission_picked!: Signal<(missionId: number) => void>;

  _ready(): void {
    this.pressed.connect(() => {
      if (!this.pickable || this.missionId === null) return;
      this.mission_picked.emit(this.missionId);
    });
  }

  sync(row: MissionRow): void {
    this.missionId = row.id;
    this.pickable = row.pickable;
    this.disabled = !row.pickable;
    this.name = `mission-${row.id}`;
    this.text = row.text;
  }
}
