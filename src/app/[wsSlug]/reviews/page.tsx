import { requireMembership } from "@/auth/guards";
import { IssueList } from "@/features/notifications/_components/IssueList";
import { listReviewIssues } from "@/features/notifications/queries";

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const issues = await listReviewIssues(
    { userId: m.userId, workspaceId: m.workspaceId },
    m.userId,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Reviews{" "}
        <span className="font-mono text-sm font-medium text-cursus-text-2">
          {issues.length}
        </span>
      </h1>
      <IssueList
        wsSlug={wsSlug}
        issues={issues}
        emptyTitle="Sin reviews pendientes"
        emptyHint="No hay issues en estado review en este workspace."
      />
    </div>
  );
}
