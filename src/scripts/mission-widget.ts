import { Button, Signal } from "godot";
import { gd } from "../lib/gd";
import type { AvailableMission } from "../lib/sim/domain";

@gd.class
export default class MissionWidget extends Button {
  mission: AvailableMission | null = null;
  @gd.signal() accessor mission_picked!: Signal<(missionId: number) => void>;

  _ready(): void {
    this.pressed.connect(() => {
      if (!this.mission) return;
      console.log("mission clicked", this.mission.id, this.mission.name);
      this.mission_picked.emit(this.mission.id);
    });
  }

  sync(mission: AvailableMission): void {
    this.mission = mission;
    this.name = `mission-${mission.id}`;
    this.text = `${mission.name}  ·  ${mission.requiredSolders} needed  ·  ${mission.duration}h`;
  }
}
