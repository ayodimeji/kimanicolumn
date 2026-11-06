/**
 * Nitro bundles PGLite into the Vercel function but leaves its data and wasm
 * files behind. Without them, a deploy that has no DATABASE_URL crashes the
 * whole server on import. Copy the three artifacts next to the bundle so the
 * in-memory fallback can start. Neon (DATABASE_URL) does not load them.
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const srcDir = join("node_modules", "@electric-sql", "pglite", "dist");
const destDir = process.env.NETLIFY
  ? join(".netlify", "functions-internal", "server", "_libs")
  : join(".vercel", "output", "functions", "__server.func", "_libs");
const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

if (!existsSync(destDir)) {
  console.log("[pglite-assets] function bundle not present — skip");
  process.exit(0);
}

for (const name of files) {
  const from = join(srcDir, name);
  if (!existsSync(from)) {
    console.warn(`[pglite-assets] missing ${from}`);
    continue;
  }
  copyFileSync(from, join(destDir, name));
  console.log(`[pglite-assets] copied ${name}`);
}
