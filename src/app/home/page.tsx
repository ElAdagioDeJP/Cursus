import { redirect } from "next/navigation";
import { requireSession } from "@/auth/guards";
import { createWorkspaceAction } from "@/features/workspaces/actions";
import { listWorkspacesForUser } from "@/features/workspaces/queries";
import { wsHome } from "@/lib/routes";
import { Button } from "@/ui/Button";

// Post-login: si ya tienes workspace te lleva al primero,
// si no te pide crear el primero. Sin esto el login caía a `/`
// (landing pública) y parecía un loop.
export const instant = false;

export default async function HomePage() {
  const session = await requireSession();
  const workspaces = await listWorkspacesForUser(session.user.id);

  if (workspaces.length === 1 && workspaces[0]) {
    redirect(wsHome(workspaces[0].slug));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <div className="rounded-lg border border-cursus-border bg-cursus-surface p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-cursus-text-1">
          {workspaces.length > 1 ? "Tus espacios" : "Crea tu primer espacio"}
        </h1>
        <p className="mt-1 text-sm text-cursus-text-3">
          {workspaces.length > 1
            ? "Elige dónde trabajar o crea uno nuevo."
            : "Para empezar necesitas un workspace."}
        </p>

        {workspaces.length > 1 && (
          <ul className="mt-4 flex flex-col gap-2">
            {workspaces.map((w) => (
              <li key={w.id}>
                <a
                  href={wsHome(w.slug)}
                  className="block rounded-md border border-cursus-border px-4 py-2.5 text-sm font-medium text-cursus-text-1 hover:bg-cursus-surface-2"
                >
                  {w.name} · `/{w.slug}`
                </a>
              </li>
            ))}
          </ul>
        )}

        <form
          action={async (fd: FormData) => {
            "use server";
            const ws = await createWorkspaceAction({
              name: String(fd.get("name")),
              slug: String(fd.get("slug")).toLowerCase(),
            });
            redirect(wsHome(ws.slug));
          }}
          className="mt-4 flex flex-col gap-2"
        >
          <label className="flex flex-col gap-1 text-sm text-cursus-text-2">
            Nombre
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="p. ej. Empovaro"
              className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-cursus-text-1 placeholder:text-cursus-text-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-cursus-text-2">
            Slug (2–30, minúsculas, números y guiones)
            <input
              name="slug"
              required
              pattern="[a-z0-9-]{2,30}"
              maxLength={30}
              placeholder="empovaro"
              className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 font-mono text-cursus-text-1 placeholder:text-cursus-text-3"
            />
          </label>
          <div>
            <Button type="submit">Crear espacio</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
