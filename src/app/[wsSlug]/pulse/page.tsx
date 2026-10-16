import Link from "next/link";
import { requireMembership } from "@/auth/guards";
import { listPulseActivity } from "@/features/notifications/queries";
import { issueDetail } from "@/lib/routes";
import { Avatar } from "@/ui/Avatar";
import { EmptyState } from "@/ui/EmptyState";

export default async function PulsePage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const activity = await listPulseActivity({
    userId: m.userId,
    workspaceId: m.workspaceId,
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Pulse{" "}
        <span className="font-mono text-sm font-medium text-cursus-text-2">
          {activity.length}
        </span>
      </h1>
      {activity.length === 0 ? (
        <EmptyState
          title="Sin actividad reciente"
          hint="Los cambios y comentarios de issues aparecerán aquí."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {activity.map((a) => (
            <li
              key={`${a.kind}:${a.id}`}
              className="flex items-center gap-3 rounded-lg border border-cursus-border bg-cursus-surface p-3 text-sm"
            >
              <Avatar name={a.actor_name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-cursus-text-2">
                  {a.actor_name ?? "Sistema"} ·{" "}
                  {a.kind === "comment" ? "comentó en" : "actualizó"}{" "}
                  <Link
                    href={issueDetail(wsSlug, a.team_id, a.issue_id)}
                    className="font-mono text-xs text-cursus-text-1 hover:underline"
                  >
                    {a.identifier}
                  </Link>
                </span>
                <span className="block truncate text-cursus-text-3">
                  {a.summary}
                </span>
              </span>
              <time className="shrink-0 font-mono text-xs text-cursus-text-3">
                {new Date(a.created_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
