import { Store } from "./store";
import { initialState } from "./seed";

const KEY = "__baseSimGameStore";

type Bag = { [KEY]?: Store };

// Each GodotJS script is a separate Bun bundle, so a plain `export const store`
// would be a different instance in Main vs MissionViewer. Pin one on globalThis.
const bag = globalThis as typeof globalThis & Bag;

export const store = bag[KEY] ??= new Store(initialState());
