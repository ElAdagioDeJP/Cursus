import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { IssueDetail } from "@/features/issues/_components/IssueDetail-client";
import { getIssue } from "@/features/issues/queries";
import { teamBoard } from "@/lib/routes";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string; issueId: string }>;
}) {
  const { wsSlug, teamId, issueId } = await params;
  const m = await requireMembership(wsSlug);
  const issue = await getIssue(
    { userId: m.userId, workspaceId: m.workspaceId },
    issueId,
  );
  if (!issue) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={teamBoard(wsSlug, teamId)}
        className="inline-flex w-fit items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
        Volver al tablero
      </Link>
      <IssueDetail
        wsSlug={wsSlug}
        teamId={teamId}
        userId={m.userId}
        issue={
          issue as unknown as React.ComponentProps<typeof IssueDetail>["issue"]
        }
      />
    </div>
  );
}
