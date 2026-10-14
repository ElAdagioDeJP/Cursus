import { describe, expect, it } from "vitest";
import {
  closesIssue,
  extractBranchIdentifiers,
  extractFixMention,
  extractIdentifiers,
} from "./parse";

describe("extractIdentifiers", () => {
  it("encuentra CUR-123 en título y cuerpo", () => {
    const found = extractIdentifiers("[CUR-123] login roto, ver cur-45");
    expect(found.map((m) => m.identifier)).toEqual(["CUR-123", "CUR-45"]);
  });
  it("dedup y normaliza a mayúsculas", () => {
    const found = extractIdentifiers("cur-7 y CUR-7");
    expect(found).toEqual([{ teamKey: "CUR", number: 7, identifier: "CUR-7" }]);
  });
  it("ignora patrones inválidos", () => {
    expect(extractIdentifiers("A-1 TOOLONGKEY-2 CUR-")).toEqual([]);
  });
});

describe("extractBranchIdentifiers", () => {
  it("lee ramas con / y _", () => {
    expect(
      extractBranchIdentifiers("feature/cur-123_login").map(
        (m) => m.identifier,
      ),
    ).toEqual(["CUR-123"]);
  });
});

describe("cierre con palabra clave", () => {
  it("detecta Fixes CUR-123", () => {
    expect(extractFixMention("Fixes CUR-123, por fin")).toEqual({
      teamKey: "CUR",
      number: 123,
      identifier: "CUR-123",
    });
    expect(extractFixMention("sin keyword CUR-123")).toBeNull();
  });
  it("closesIssue liga la keyword a ese identifier", () => {
    expect(closesIssue("Fixes CUR-1, relates to CUR-2", "CUR-1")).toBe(true);
    expect(closesIssue("Fixes CUR-1, relates to CUR-2", "CUR-2")).toBe(false);
    expect(closesIssue("closes cur-9", "CUR-9")).toBe(true);
  });
});
