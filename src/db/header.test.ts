import { describe, expect, it } from "vitest";
import {
  computeChecksum,
  MigrationHeaderError,
  parseHeader,
  validateChain,
} from "./header";

const GOOD = `-- migration: 20261014100000
-- name: issues
-- author: Juan Vargas <juan@delfostrading.com>
-- date: 2026-10-14
-- description: crea issues
-- requires: 20261013090000

create table issues (id uuid primary key);
`;

describe("parseHeader", () => {
  it("acepta cabecera completa válida", () => {
    const { header, body } = parseHeader("20261014100000_issues.sql", GOOD);
    expect(header.version).toBe("20261014100000");
    expect(header.authorEmail).toBe("juan@delfostrading.com");
    expect(header.requires).toBe("20261013090000");
    expect(body).toContain("create table");
  });
  it("rechaza nombre de archivo inválido", () => {
    expect(() => parseHeader("issues.sql", GOOD)).toThrow(MigrationHeaderError);
  });
  it("rechaza autor sin email", () => {
    expect(() =>
      parseHeader(
        "20261014100000_issues.sql",
        GOOD.replace("Juan Vargas <juan@delfostrading.com>", "Juan"),
      ),
    ).toThrow(/author/);
  });
  it("rechaza email malformado", () => {
    expect(() =>
      parseHeader(
        "20261014100000_issues.sql",
        GOOD.replace("<juan@delfostrading.com>", "<no-es-email>"),
      ),
    ).toThrow(/author/);
  });
  it("rechaza fecha inválida", () => {
    expect(() =>
      parseHeader(
        "20261014100000_issues.sql",
        GOOD.replace("2026-10-14", "14/10/2026"),
      ),
    ).toThrow(/date/);
  });
  it("rechaza version distinta del archivo", () => {
    expect(() => parseHeader("20261015090000_issues.sql", GOOD)).toThrow(
      /coincide/,
    );
  });
  it("rechaza drop database fuera de comentarios", () => {
    expect(() =>
      parseHeader("20261014100000_issues.sql", `${GOOD}\ndrop database app;`),
    ).toThrow(/denegado/);
  });
  it("permite mencionar drop database dentro de comentarios", () => {
    const ok = `${GOOD}\n-- nota: nunca hacer drop database aquí\n`;
    expect(() => parseHeader("20261014100000_issues.sql", ok)).not.toThrow();
  });
});

describe("validateChain", () => {
  const h = (version: string, requires: string | null) => ({
    fileName: `${version}_x.sql`,
    header: {
      version,
      name: "x",
      authorName: "J",
      authorEmail: "j@x.com",
      date: "2026-10-12",
      description: "d",
      requires,
    },
  });
  it("acepta cadena lineal", () => {
    expect(() =>
      validateChain([
        h("20261012080000", null),
        h("20261013090000", "20261012080000"),
      ]),
    ).not.toThrow();
  });
  it("exige none en la primera", () => {
    expect(() =>
      validateChain([h("20261012080000", "20261011080000")]),
    ).toThrow(/none/);
  });
  it("rechaza salto de requires", () => {
    expect(() =>
      validateChain([
        h("20261012080000", null),
        h("20261014100000", "20261012080000"),
      ]),
    ).not.toThrow();
    expect(() =>
      validateChain([
        h("20261012080000", null),
        h("20261014100000", "20261099999999"),
      ]),
    ).toThrow(/anterior/);
  });
});

describe("computeChecksum", () => {
  it("cambia si cambia el cuerpo", () => {
    expect(computeChecksum("a;")).not.toBe(computeChecksum("b;"));
    expect(computeChecksum("a;")).toBe(computeChecksum("  a;  "));
  });
});
