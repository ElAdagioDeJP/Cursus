import { requireMembership } from "@/auth/guards";
import { canManage } from "@/auth/roles";
import { renameWorkspaceAction } from "@/features/workspaces/actions";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { Button } from "@/ui/Button";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const ws = await getWorkspaceBySlug(wsSlug);
  const managed = canManage(m.role);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Ajustes
      </h1>
      <div className="rounded-lg border border-cursus-border bg-cursus-surface p-4 text-sm text-cursus-text-1">
        <p>
          <span className="text-cursus-text-3">Slug:</span>{" "}
          <span className="font-mono">{ws?.slug}</span>
        </p>
        <p>
          <span className="text-cursus-text-3">Nombre:</span> {ws?.name}
        </p>
        <p>
          <span className="text-cursus-text-3">Tu rol:</span>{" "}
          <span className="font-mono text-[13px]">{m.role}</span>
        </p>
      </div>
      {managed ? (
        <form
          action={async (fd: FormData) => {
            "use server";
            await renameWorkspaceAction(wsSlug, String(fd.get("name")));
          }}
          className="flex gap-2"
        >
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={ws?.name}
            aria-label="Nombre del workspace"
            className="flex-1 rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3"
          />
          <Button type="submit">Renombrar</Button>
        </form>
      ) : (
        <p className="text-sm text-cursus-text-3">
          Solo Owner y Admin pueden renombrar el workspace.
        </p>
      )}
    </div>
  );
}
