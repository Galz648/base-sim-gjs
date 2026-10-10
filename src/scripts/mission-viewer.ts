import { Control, Signal } from "godot";
import { gd } from "../lib/gd";
import { store } from "../lib/sim/game-store";
import type { AvailableMission } from "../lib/sim/domain";
import type MissionDetail from "./mission-detail";
import type MissionList from "./mission-list";

@gd.class
export default class MissionViewer extends Control {
  selected: AvailableMission | null = null;
  pickedIds: number[] = [];
  unsub: (() => void) | null = null;
  @gd.onready("AvailableMissions") accessor list!: MissionList;
  @gd.onready("InProgress") accessor in_progress!: MissionList;
  @gd.onready("Completed") accessor completed!: MissionList;
  @gd.onready("MissionDetail") accessor detail!: MissionDetail;
  @gd.signal() accessor mission_opened!: Signal<() => void>;
  @gd.signal() accessor mission_closed!: Signal<() => void>;

  _ready(): void {
    this.unsub = store.subscribe(() => this.pull());
    this.list.mission_picked.connect((id) => this.onMissionPicked(id));
    this.detail.mission_closed.connect(() => this.onMissionClosed());
    this.detail.soldier_toggled.connect((id) => this.onSoldierToggled(id));
    this.detail.assign_pressed.connect(() => this.onAssignPressed());
    this.pull();
  }

  _exit_tree(): void {
    this.unsub?.();
  }

  pull(): void {
    const state = store.getState();
    this.list.sync(state.available.map((mission) => ({
      id: mission.id,
      text: `${mission.name}  ·  ${mission.requiredSolders} needed  ·  ${mission.duration}h`,
      pickable: true,
    })));
    this.in_progress.sync(state.in_progress.map((mission) => ({
      id: mission.id,
      text: `${mission.name}  ·  ${mission.remaining}h left`,
      pickable: false,
    })));
    this.completed.sync(state.completed.map((mission) => ({
      id: mission.id,
      text: `${mission.name}  ·  done`,
      pickable: false,
    })));
    if (this.selected && !state.available.some((item) => item.id === this.selected?.id)) {
      this.onMissionClosed();
      return;
    }
    this.detail.sync(this.selected && {
      mission: this.selected,
      roster: state.roster,
      pickedIds: this.pickedIds,
    });
  }

  onMissionPicked(id: number): void {
    const mission = store.getState().available.find((item) => item.id === id);
    if (!mission) return;
    this.selected = mission;
    this.pickedIds = [];
    this.detail.sync({
      mission,
      roster: store.getState().roster,
      pickedIds: this.pickedIds,
    });
    this.mission_opened.emit();
  }

  onSoldierToggled(id: number): void {
    const soldier = store.getState().roster.find((item) => item.id === id);
    if (!soldier || soldier.duty === "active") return;
    this.pickedIds = this.pickedIds.includes(id)
      ? this.pickedIds.filter((item) => item !== id)
      : [...this.pickedIds, id];
    if (!this.selected) return;
    this.detail.sync({
      mission: this.selected,
      roster: store.getState().roster,
      pickedIds: this.pickedIds,
    });
  }

  onAssignPressed(): void {
    if (!this.selected) return;
    if (this.pickedIds.length < this.selected.requiredSolders) return;
    store.dispatch({
      type: "Assign",
      _tag: "action/assign",
      missionId: this.selected.id,
      soldierIds: this.pickedIds,
    });
  }

  onMissionClosed(): void {
    this.selected = null;
    this.pickedIds = [];
    this.detail.sync(null);
    this.mission_closed.emit();
  }
}
