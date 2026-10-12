import { requireMembership } from "@/auth/guards";
import { listMembers } from "@/features/workspaces/queries";
import { Avatar } from "@/ui/Avatar";
import { EmptyState } from "@/ui/EmptyState";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const members = await listMembers(m.workspaceId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Miembros{" "}
        <span className="font-mono text-sm font-medium text-cursus-text-2">
          {members.length}
        </span>
      </h1>
      {members.length === 0 ? (
        <EmptyState
          title="Sin miembros"
          hint="Invita a tu equipo para empezar a colaborar."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-lg border border-cursus-border bg-cursus-surface p-3 text-sm"
            >
              <Avatar name={u.name ?? u.email} />
              <span className="font-medium text-cursus-text-1">
                {u.name ?? u.email}
              </span>
              <span className="truncate font-mono text-[13px] text-cursus-text-3">
                {u.email}
              </span>
              <span className="ml-auto rounded-full bg-cursus-surface-2 px-2 py-0.5 font-mono text-xs text-cursus-text-2">
                {u.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
