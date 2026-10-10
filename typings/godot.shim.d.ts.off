// Minimal typings so `tsc` works before `bun run types`. That command parks this file at
// typings/godot.shim.d.ts.off (it merges badly with the generated `declare module "godot"`).
// `bun run types:shim` restores it. `Script.call("new")` lives in godot-extras.d.ts.
declare module "godot" {
  export const Variant: { Type: { TYPE_INT: number; TYPE_FLOAT: number; TYPE_STRING: number; TYPE_BOOL: number } };
  export class Resource {}
  export class PackedScene<T = any> {
    instantiate(): T;
  }
  export class Script extends Resource { call(method: string, ...args: any[]): any; }
  export class ResourceLoader {
    static load(path: string, typeHint?: string, cacheMode?: number): Resource;
  }
  // Same constraint as the generated typings (`Signal<(...args) => void>`), so scripts typecheck before and after `bun run types`.
  export class Signal<T extends (...args: any[]) => void = (...args: any[]) => void> {
    emit(...args: Parameters<T>): void;
    as_promise(): Promise<unknown>;
  }
  export class Node {
    name: string;
    get_tree(): { quit(code?: number): void };
    get_node(path: string): Node | null;
    add_child(node: Node): void;
    remove_child(node: Node): void;
    set_script(script: Script): void;
    has_signal(name: string): boolean;
    queue_free(): void;
    _ready?(): void;
    _process?(delta: number): void;
    _exit_tree?(): void;
  }
  export class CanvasItem extends Node {}
  export class Control extends CanvasItem {
    visible: boolean;
  }
  export class Label extends Control {
    text: string;
  }
  export class BaseButton extends Control {
    pressed: Signal<() => void>;
    disabled: boolean;
  }
  export class Button extends BaseButton {
    text: string;
  }
  export class Container extends Control {}
  export class BoxContainer extends Container {}
  export class VBoxContainer extends BoxContainer {}
}
declare module "godot.annotations" {
  // Minimal shim; `bun run types` generates the real thing. Decorators are TC39 standard (use `accessor`), not experimentalDecorators.
  type Dec = (value: any, context: any) => any;
  export interface ClassBinder {
    (): Dec;
    export(type: unknown, options?: object): Dec;
    signal(): Dec;
  }
  export function createClassBinder(): ClassBinder;
}
