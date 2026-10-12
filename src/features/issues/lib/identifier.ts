/** identifier = TEAMKEY-number (ej CUR-123). Puro y testeable. */

const IDENTIFIER_RE = /^([A-Z]{2,6})-(\d{1,9})$/;

export function parseIdentifier(identifier: string): {
  teamKey: string;
  number: number;
} {
  const m = IDENTIFIER_RE.exec(identifier.trim());
  if (!m)
    throw new Error(
      `Identificador inválido: ${identifier}. Esperado TEAMKEY-number (ej CUR-123).`,
    );
  return { teamKey: m[1] as string, number: Number(m[2]) };
}

export function formatIdentifier(teamKey: string, number: number): string {
  return `${teamKey}-${number}`;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
