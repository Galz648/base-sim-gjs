// Run the GodotJS binary named by GODOTJS (Bun loads it from .env) with the given arguments.
// Used by the package.json scripts so nobody has to `export GODOTJS` in every shell.
const bin = process.env.GODOTJS;
if (!bin) {
  console.error("error: GODOTJS is not set. Copy .env.example to .env and point it at the GodotJS editor binary.");
  process.exit(1);
}
const child = Bun.spawn([bin, ...process.argv.slice(2)], { stdio: ["inherit", "inherit", "inherit"] });
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.exit(await child.exited);
