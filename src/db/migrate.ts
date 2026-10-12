/**
 * Runner propio de migraciones (§4.4) sobre postgres.js.
 * Uso: bun src/db/migrate.ts up | status | --dry-run
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSql } from "./client";
import {
  computeChecksum,
  migrationsDir,
  parseHeader,
  validateChain,
} from "./header";

const dir = migrationsDir();
const args = process.argv.slice(2);

async function loadFiles() {
  const files = (await readdir(dir).catch(() => []))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const entries = [];
  for (const f of files) {
    const content = await readFile(join(dir, f), "utf8");
    const { header, body } = parseHeader(f, content);
    entries.push({
      fileName: f,
      header,
      body,
      checksum: computeChecksum(body),
    });
  }
  validateChain(entries);
  return entries;
}

async function main(): Promise<void> {
  const entries = await loadFiles();
  const sql = getSql();
  const reg =
    (await sql`select to_regclass('public._migrations') as r`) as Array<{
      r: string | null;
    }>;
  if (!reg[0]?.r) {
    await sql`create table _migrations (
      version text primary key,
      name text not null,
      author text not null,
      applied_at timestamptz not null default now(),
      checksum text not null,
      duration_ms integer not null
    )`;
  }
  const applied = await sql`select version, checksum from _migrations`;
  const appliedByVersion = new Map(
    applied.map((r) => [r.version as string, r.checksum as string]),
  );

  if (args.includes("status")) {
    const done = entries.filter((e) => appliedByVersion.has(e.header.version));
    const pending = entries.filter(
      (e) => !appliedByVersion.has(e.header.version),
    );
    console.log(`aplicadas: ${done.length}\npendientes: ${pending.length}`);
    for (const e of pending) console.log(`  - pendiente ${e.fileName}`);
    process.exit(0);
  }

  if (args.includes("--dry-run")) {
    const pending = entries.filter(
      (e) => !appliedByVersion.has(e.header.version),
    );
    console.log(`dry-run: aplicaría ${pending.length} migración(es)`);
    for (const e of pending)
      console.log(`  - ${e.fileName} (${e.header.description})`);
    process.exit(0);
  }

  // up (defecto)
  for (const e of entries) {
    const prev = appliedByVersion.get(e.header.version);
    if (prev !== undefined) {
      if (prev !== e.checksum) {
        console.error(
          `❌ Migración ${e.header.version} modificada después de aplicada. Crea una migración correctiva nueva, no edites la existente.`,
        );
        process.exit(1);
      }
      continue;
    }
    const started = Date.now();
    await sql.begin(async (tx) => {
      await tx.unsafe(e.body);
      await tx`insert into _migrations (version, name, author, checksum, duration_ms)
        values (${e.header.version}, ${e.header.name}, ${`${e.header.authorName} <${e.header.authorEmail}>`}, ${e.checksum}, ${Date.now() - started})`;
    });
    console.log(`✔ aplicada ${e.fileName} (${Date.now() - started}ms)`);
  }
  console.log(`db:migrate OK — ${entries.length} en cadena, base al día.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? `❌ ${err.message}` : String(err));
  process.exit(1);
});
