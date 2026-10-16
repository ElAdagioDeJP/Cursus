import Image from "next/image";
import { connection } from "next/server";
import { signIn } from "@/auth/config";

// El build de Docker corre sin AUTH_* (env solo existe en runtime en Dokploy).
// Con `cacheComponents` no se puede usar `export const dynamic`; se usa
// `await connection()` + `instant = false` para no prerenderizar en build.
export const instant = false;

export default async function SignInPage() {
  await connection();
  // Solo se muestra el botón del provider con credenciales en el entorno.
  // Evita mandar al usuario a un `Error 401: invalid_client` garantizado.
  // Se lee aquí (runtime) y no a nivel módulo (build) a propósito.
  const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID);
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID);
  return (
    <main className="cursus-pattern-grid bg-cursus-bg">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="rounded-lg border border-cursus-border bg-cursus-surface p-8">
          <div className="flex flex-col gap-4">
            <div>
              <Image
                src="/brand/logotipo-horizontal-dark.svg"
                alt="cursus"
                width={120}
                height={26}
              />
              <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-cursus-text-1">
                Iniciar sesión
              </h1>
              <p className="mt-1 text-sm text-cursus-text-3">
                Accede con tu cuenta. Sin contraseñas en MVP.
              </p>
            </div>
            {githubEnabled && (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="cursus-pressable w-full rounded-md bg-cursus-primary px-4 py-2.5 text-sm font-medium text-cursus-on-primary hover:bg-cursus-primary-hover"
                >
                  Continuar con GitHub
                </button>
              </form>
            )}
            {googleEnabled && (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="cursus-pressable w-full rounded-md border border-cursus-border px-4 py-2.5 text-sm font-medium text-cursus-text-1 hover:bg-cursus-surface-2"
                >
                  Continuar con Google
                </button>
              </form>
            )}
            {!githubEnabled && !googleEnabled && (
              <p
                role="alert"
                className="rounded-md border border-cursus-border bg-cursus-surface-2 px-4 py-3 text-sm text-cursus-text-2"
              >
                Inicio de sesión no configurado: falta `AUTH_GITHUB_ID` o
                `AUTH_GOOGLE_ID` en el entorno del servidor.
              </p>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-cursus-text-3">
          Al entrar aceptas las reglas del workspace.
        </p>
      </div>
    </main>
  );
}
