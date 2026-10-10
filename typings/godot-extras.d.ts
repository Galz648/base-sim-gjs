// Kept beside both the shim and the generated typings.
// Generated `Object.call` only accepts names on the class. GodotJS still constructs with `call("new")`.
// Generated `Signal.connect` takes a Callable. The build plugin wraps a plain function, so scripts may pass one.
declare module "godot" {
  interface Script {
    call(method: "new", ...args: any[]): any;
  }
  interface Signal<T extends (...args: any[]) => void> {
    connect(fn: T, flags?: number): void;
    emit(...args: Parameters<T>): void;
  }
  interface Node {
    name: string;
    get_name(): string;
    get_node(path: string): Node | null;
    add_child(node: Node): void;
    remove_child(node: Node): void;
    queue_free(): void;
  }
  interface Control {
    visible: boolean;
  }
  interface Label {
    text: string;
  }
  interface BaseButton {
    disabled: boolean;
  }
  interface Button {
    disabled: boolean;
  }
  interface PackedScene<T = any> {
    instantiate(): T;
  }
}
