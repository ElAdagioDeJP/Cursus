/**
 * Parseo puro de menciones TEAMKEY-number (ej CUR-123) en texto de GitHub:
 * ramas, títulos/body de PR y mensajes de commit. Sin I/O, testeable.
 */

export interface IssueMention {
  teamKey: string;
  number: number;
  identifier: string;
}

const MENTION_RE = /\b([A-Z]{2,6})-(\d{1,9})\b/g;

/** Extrae identificadores únicos en orden de aparición. Insensible a mayús. */
export function extractIdentifiers(text: string): IssueMention[] {
  const upper = text.toUpperCase();
  const seen = new Set<string>();
  const out: IssueMention[] = [];
  for (const m of upper.matchAll(MENTION_RE)) {
    const teamKey = m[1] as string;
    const number = Number(m[2]);
    const identifier = `${teamKey}-${number}`;
    if (seen.has(identifier)) continue;
    seen.add(identifier);
    out.push({ teamKey, number, identifier });
  }
  return out;
}

/** Atajo para ramas (`cur-123-slug`, `feature/CUR-123-x`, …). */
export function extractBranchIdentifiers(branch: string): IssueMention[] {
  return extractIdentifiers(branch.replace(/[/_]+/g, " "));
}

const FIX_RE =
  /\b(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\s+([A-Z]{2,6})-(\d{1,9})\b/i;

/** Primera mención con palabra de cierre (`Fixes CUR-123`), o null. */
export function extractFixMention(text: string): IssueMention | null {
  const m = FIX_RE.exec(text);
  if (!m) return null;
  const teamKey = (m[1] as string).toUpperCase();
  const number = Number(m[2]);
  return { teamKey, number, identifier: `${teamKey}-${number}` };
}

/** ¿El texto cierra explícitamente este identifier? (`Fixes CUR-123`). */
export function closesIssue(text: string, identifier: string): boolean {
  const escaped = identifier
    .toUpperCase()
    .replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
  const re = new RegExp(
    `\\b(?:fix|fixes|fixed|close|closes|closed|resolve|resolves|resolved)\\s+${escaped}\\b`,
    "i",
  );
  return re.test(text);
}
