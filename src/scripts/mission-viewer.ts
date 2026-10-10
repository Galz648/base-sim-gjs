import { Control, Signal } from "godot";
import { gd } from "../lib/gd";
import { store } from "../lib/sim/game-store";
import type { AvailableMission } from "../lib/sim/domain";
import type MissionDetail from "./mission-detail";
import type MissionList from "./mission-list";

@gd.class
export default class MissionViewer extends Control {
  selected: AvailableMission | null = null;
  unsub: (() => void) | null = null;
  @gd.onready("AvailableMissions") accessor list!: MissionList;
  @gd.onready("MissionDetail") accessor detail!: MissionDetail;
  @gd.signal() accessor mission_opened!: Signal<() => void>;
  @gd.signal() accessor mission_closed!: Signal<() => void>;

  _ready(): void {
    this.unsub = store.subscribe(() => this.pull());
    this.list.mission_picked.connect((id) => this.onMissionPicked(id));
    this.detail.mission_closed.connect(() => this.onMissionClosed());
    this.pull();
  }

  _exit_tree(): void {
    this.unsub?.();
  }

  pull(): void {
    this.list.sync(store.getState().available);
    this.detail.sync(this.selected);
  }

  onMissionPicked(id: number): void {
    const mission = store.getState().available.find((item) => item.id === id);
    if (!mission) return;
    this.selected = mission;
    this.detail.sync(mission);
    this.mission_opened.emit();
  }

  onMissionClosed(): void {
    this.selected = null;
    this.detail.sync(null);
    this.mission_closed.emit();
  }
}
