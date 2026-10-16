import { requireMembership } from "@/auth/guards";
import { IssueList } from "@/features/notifications/_components/IssueList";
import { listInboxIssues } from "@/features/notifications/queries";

export default async function InboxPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const issues = await listInboxIssues(
    { userId: m.userId, workspaceId: m.workspaceId },
    m.userId,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Inbox{" "}
        <span className="font-mono text-sm font-medium text-cursus-text-2">
          {issues.length}
        </span>
      </h1>
      <IssueList
        wsSlug={wsSlug}
        issues={issues}
        emptyTitle="Inbox vacío"
        emptyHint="No tienes issues activos asignados. Todo al día."
      />
    </div>
  );
}
