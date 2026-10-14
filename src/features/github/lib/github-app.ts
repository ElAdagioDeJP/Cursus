/**
 * Cliente mínimo de GitHub App (sin dependencias): JWT RS256 con Node:crypto
 * + fetch a api.github.com. Todo best-effort: si falla, el webhook igual
 * vincula en Cursus y el error solo se loguea.
 */
import { createSign } from "node:crypto";

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function normalizeKey(pem: string): string {
  return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
}

/** JWT de App válido 10 min para pedir tokens de instalación. */
export function buildAppJwt(
  appId: string,
  privateKeyPem: string,
  nowSec = Math.floor(Date.now() / 1000),
): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ iat: nowSec - 60, exp: nowSec + 10 * 60, iss: appId }),
  );
  const data = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(data);
  const signature = signer.sign(normalizeKey(privateKeyPem).trim());
  return `${data}.${base64url(signature)}`;
}

export interface AppCredentials {
  appId: string;
  privateKeyPem: string;
}

export function appCredentialsFromEnv(): AppCredentials | null {
  const appId = process.env.GITHUB_APP_ID ?? "";
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY ?? "";
  if (!appId || !privateKeyPem) return null;
  return { appId, privateKeyPem };
}

export async function getInstallationToken(
  creds: AppCredentials,
  installationId: number,
): Promise<string> {
  const jwt = buildAppJwt(creds.appId, creds.privateKeyPem);
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!res.ok) throw new Error(`Token de instalación: GitHub ${res.status}.`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("GitHub no devolvió token.");
  return data.token;
}

/** Comenta en el PR (best-effort, nunca lanza). */
export async function commentOnPullRequest(
  installationId: number,
  repoFullName: string,
  prNumber: number,
  body: string,
): Promise<void> {
  try {
    const creds = appCredentialsFromEnv();
    if (!creds) return;
    const token = await getInstallationToken(creds, installationId);
    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({ body }),
      },
    );
    if (!res.ok) console.error(`[github] comentario PR falló: ${res.status}`);
  } catch (err) {
    console.error(
      `[github] comentario PR: ${err instanceof Error ? err.message : err}`,
    );
  }
}
