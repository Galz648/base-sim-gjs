// Fails if anything under tui/ imports from the sim other than src/lib/sim/api.
// Run by .githooks/pre-commit. Usage: bun tools/check-tui-boundary.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const TUI = join(ROOT, "tui");
const IMPORT = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
  );

const violations: string[] = [];
for (const file of walk(TUI)) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(IMPORT)) {
    const spec = m[1];
    if (!spec.startsWith(".")) continue; // packages are fine
    const target = join(file, "..", spec).replace(ROOT + "/", "");
    if (target.startsWith("tui/") || target === "tui") continue; // inside the TUI
    if (target === "src/lib/sim/api") continue; // the one door
    violations.push(`${file.replace(ROOT + "/", "")}: imports "${spec}" (allowed: src/lib/sim/api)`);
  }
}

if (violations.length) {
  console.error("TUI boundary violated. The driver may only import the sim through src/lib/sim/api:\n  " + violations.join("\n  "));
  process.exit(1);
}
console.log("tui boundary ok");
