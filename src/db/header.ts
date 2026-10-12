/**
 * Funciones puras del sistema de migraciones (§4). Sin I/O de red ni FS.
 * Seam testeable: header.test.ts las cubre sin DB.
 */
import { createHash } from "node:crypto";
import { join } from "node:path";

/** Directorio de migraciones: MIGRATIONS_DIR (Docker: /app/migrations) o src/db/migrations en dev. */
export function migrationsDir(): string {
  return (
    process.env.MIGRATIONS_DIR ?? join(process.cwd(), "src", "db", "migrations")
  );
}

export interface MigrationHeader {
  version: string;
  name: string;
  authorName: string;
  authorEmail: string;
  date: string;
  description: string;
  /** null cuando es la primera migración (`requires: none`) */
  requires: string | null;
}

export class MigrationHeaderError extends Error {}

const FILENAME_RE = /^(\d{14})_[a-z0-9_]+\.sql$/;
const AUTHOR_RE = /^(.+) <([^<>@\s]+@[^<>@\s]+\.[^<>@\s]+)>$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED_KEYS = [
  "migration",
  "name",
  "author",
  "date",
  "description",
  "requires",
] as const;

export function parseHeader(
  fileName: string,
  content: string,
): { header: MigrationHeader; body: string } {
  const fileMatch = FILENAME_RE.exec(fileName);
  if (!fileMatch) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: nombre inválido. Esperado YYYYMMDDHHMMSS_nombre_snake.sql (minúsculas, números, _).`,
    );
  }
  const fileVersion = fileMatch[1] as string;

  const lines = content.split("\n");
  const meta = new Map<string, string>();
  let bodyStart = 0;
  for (const [i, line] of lines.entries()) {
    const m = /^--\s*([a-zA-Z]+)\s*:\s*(.+)\s*$/.exec(line.trim());
    if (!m) {
      bodyStart = i;
      break;
    }
    const key = m[1];
    const value = m[2];
    if (key === undefined || value === undefined) {
      bodyStart = i;
      break;
    }
    meta.set(key.toLowerCase(), value.trim());
    bodyStart = i + 1;
  }
  const body = lines.slice(bodyStart).join("\n");

  for (const key of REQUIRED_KEYS) {
    if (!meta.get(key)) {
      throw new MigrationHeaderError(
        `❌ ${fileName}: falta campo de cabecera \`${key}\`.`,
      );
    }
  }

  const version = meta.get("migration") as string;
  if (version !== fileVersion) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: \`migration\` (${version}) no coincide con el timestamp del archivo (${fileVersion}).`,
    );
  }

  const author = meta.get("author") as string;
  const authorMatch = AUTHOR_RE.exec(author);
  if (!authorMatch) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: \`author\` debe tener formato \`Nombre <email>\`. Recibido: ${author}`,
    );
  }
  const authorName = authorMatch[1];
  const authorEmail = authorMatch[2];
  if (authorName === undefined || authorEmail === undefined) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: \`author\` debe tener formato \`Nombre <email>\`. Recibido: ${author}`,
    );
  }

  const date = meta.get("date") as string;
  if (
    !DATE_RE.test(date) ||
    Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())
  ) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: \`date\` debe ser YYYY-MM-DD válida. Recibido: ${date}`,
    );
  }

  const requiresRaw = meta.get("requires") as string;
  const requires = requiresRaw.toLowerCase() === "none" ? null : requiresRaw;

  if (body.trim().length === 0 || !body.includes(";")) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: archivo vacío o sin sentencias SQL (\`;' ausente).`,
    );
  }

  const denied = scanDenied(body);
  if (denied) {
    throw new MigrationHeaderError(
      `❌ ${fileName}: SQL denegado por seguridad: ${denied}.`,
    );
  }

  return {
    header: {
      version,
      name: meta.get("name") as string,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      date,
      description: meta.get("description") as string,
      requires,
    },
    body,
  };
}

/** Quita comentarios -- y /* *\/ para el scan de deny-list. */
export function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("--"))
    .join("\n");
}

export function scanDenied(body: string): string | null {
  const clean = stripComments(body);
  if (/drop\s+database/i.test(clean))
    return "`drop database` prohibido en migraciones";
  if (/drop\s+schema\s+public/i.test(clean))
    return "`drop schema public` prohibido en migraciones";
  if (/;--/.test(clean))
    return "secuencia `;--` sospechosa fuera de comentarios";
  return null;
}

/** Cadena lineal: la primera exige `none`, cada una requiere la anterior. Sin huecos ni ramas. */
export function validateChain(
  entries: Array<{ fileName: string; header: MigrationHeader }>,
): void {
  const seen = new Set<string>();
  for (const [i, e] of entries.entries()) {
    if (seen.has(e.header.version)) {
      throw new MigrationHeaderError(
        `❌ ${e.fileName}: versión duplicada ${e.header.version}.`,
      );
    }
    seen.add(e.header.version);
    if (i === 0) {
      if (e.header.requires !== null) {
        throw new MigrationHeaderError(
          `❌ ${e.fileName}: la primera migración debe declarar \`requires: none\`.`,
        );
      }
    } else {
      const prevEntry = entries[i - 1];
      const prev = prevEntry?.header.version;
      if (e.header.requires !== prev) {
        throw new MigrationHeaderError(
          `❌ ${e.fileName}: \`requires\` (${e.header.requires ?? "vacío"}) debe ser la migración anterior (${prev}). Orden lineal, sin ramas.`,
        );
      }
    }
  }
}

/** sha256 del cuerpo (sin cabecera). Detecta edición retroactiva. */
export function computeChecksum(body: string): string {
  return createHash("sha256").update(body.trim()).digest("hex");
}
