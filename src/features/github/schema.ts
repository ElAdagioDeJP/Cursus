/**
 * Esquemas zod de entrada (§2.2) para la integración GitHub.
 * El payload del webhook NO se valida estricto (GitHub lo versiona);
 * se extrae con guards defensivos en handler.ts.
 */
import { z } from "zod";

export const ConnectInstallationSchema = z
  .object({
    workspaceId: z.uuid(),
    installationId: z.number().int().positive(),
    accountLogin: z.string().trim().min(1).max(200),
    accountType: z.enum(["Organization", "User"]).default("Organization"),
  })
  .strict();
export type ConnectInstallationInput = z.infer<
  typeof ConnectInstallationSchema
>;

export const LinkStateEnum = z.enum(["open", "closed", "merged"]);
export type LinkState = z.infer<typeof LinkStateEnum>;
