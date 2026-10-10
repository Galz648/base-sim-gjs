import { Label } from "godot";
import { gd } from "../lib/gd";
import type { Time } from "../lib/sim/domain";

@gd.class
export default class Clock extends Label {
  sync(time: Time): void {
    this.text = `Day ${time.day}  ${String(time.hour).padStart(2, "0")}:00`;
  }
}
