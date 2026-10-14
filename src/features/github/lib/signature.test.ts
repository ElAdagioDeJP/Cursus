import { describe, expect, it } from "vitest";
import { signPayload, verifySignature } from "./signature";

describe("firma HMAC del webhook", () => {
  it("roundtrip firma → verifica", () => {
    const secret = "secreto-de-prueba";
    const raw = JSON.stringify({ action: "opened", n: 1 });
    const header = signPayload(secret, raw);
    expect(verifySignature(secret, raw, header)).toBe(true);
  });
  it("rechaza cuerpo manipulado, secreto distinto y cabecera rota", () => {
    const header = signPayload("a", "cuerpo");
    expect(verifySignature("a", "cuerpo-tocado", header)).toBe(false);
    expect(verifySignature("b", "cuerpo", header)).toBe(false);
    expect(verifySignature("a", "cuerpo", null)).toBe(false);
    expect(verifySignature("a", "cuerpo", "md5=xxx")).toBe(false);
    expect(verifySignature("", "cuerpo", header)).toBe(false);
  });
});
