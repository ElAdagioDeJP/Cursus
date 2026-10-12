import { describe, expect, it } from "vitest";
import { formatIdentifier, isUuid, parseIdentifier } from "./identifier";

describe("identifier", () => {
  it("parsea CUR-123", () => {
    expect(parseIdentifier("CUR-123")).toEqual({ teamKey: "CUR", number: 123 });
  });
  it("rechaza formatos inválidos", () => {
    expect(() => parseIdentifier("cur-123")).toThrow();
    expect(() => parseIdentifier("CUR123")).toThrow();
    expect(() => parseIdentifier("TOOLONGKEY-1")).toThrow();
  });
  it("formatea identifier", () => {
    expect(formatIdentifier("DEL", 45)).toBe("DEL-45");
  });
  it("detecta uuid", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUuid("CUR-123")).toBe(false);
  });
});
