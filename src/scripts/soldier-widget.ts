import { Button, Signal } from "godot";
import { gd } from "../lib/gd";
import type { AliveSoldierState } from "../lib/sim/domain";

export type SoldierRow = {
  soldier: AliveSoldierState;
  picked: boolean;
};

@gd.class
export default class SoldierWidget extends Button {
  soldierId: number | null = null;
  @gd.signal() accessor soldier_toggled!: Signal<(soldierId: number) => void>;

  _ready(): void {
    this.pressed.connect(() => {
      if (this.soldierId === null) return;
      this.soldier_toggled.emit(this.soldierId);
    });
  }

  sync(row: SoldierRow): void {
    const { soldier, picked } = row;
    this.soldierId = soldier.id;
    this.name = `soldier-${soldier.id}`;
    const occupied = soldier.duty === "active";
    this.disabled = occupied;
    const mark = picked ? "✓  " : "";
    const duty = occupied ? "on mission" : "rest";
    this.text = `${mark}${soldier.name}  ·  ${duty}  ·  ${soldier.health}hp  ${soldier.stamina}stm`;
  }
}
