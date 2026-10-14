/**
 * Firma HMAC del webhook de GitHub (x-hub-signature-256). Puro y testeable.
 * El cuerpo debe ser el texto crudo, sin re-serializar.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(secret: string, rawBody: string): string {
  const digest = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  return `sha256=${digest}`;
}

export function verifySignature(
  secret: string,
  rawBody: string,
  header: string | null,
): boolean {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(signPayload(secret, rawBody), "utf8");
  const received = Buffer.from(header, "utf8");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
