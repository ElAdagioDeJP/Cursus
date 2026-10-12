/**
 * CLI: bun run db:validate — §4.5. Puro FS, sin tocar DB.
 * Falla (exit 1, mensaje en español) si hay cualquier violación.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { migrationsDir, parseHeader, validateChain } from "./header";

const dir = migrationsDir();
const files = (await readdir(dir).catch(() => []))
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`❌ Sin archivos .sql en ${dir}. Revisa MIGRATIONS_DIR.`);
  process.exit(1);
}

try {
  const entries = [];
  for (const f of files) {
    const content = await readFile(join(dir, f), "utf8");
    const { header } = parseHeader(f, content);
    entries.push({ fileName: f, header });
  }
  validateChain(entries);
  console.log(
    `db:validate OK — ${entries.length} migración(es) con autor válido y cadena lineal.`,
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
