/** Board-server (RSC): membership + datos cacheados por tag → Board-client. */
import { cacheTag } from "next/cache";
import { requireMembership } from "@/auth/guards";
import { listIssues } from "../queries";
import type { WorkflowStatus } from "../schema";
import { BoardClient } from "./Board-client";
import type { IssueFilterState } from "./filters";

async function getBoardIssues(args: {
  userId: string;
  workspaceId: string;
  teamId: string;
  status: WorkflowStatus[];
  assigneeId?: string;
  projectId?: string;
  q?: string;
}) {
  "use cache";
  cacheTag(`issues:team:${args.teamId}`);
  const { issues } = await listIssues(
    { userId: args.userId, workspaceId: args.workspaceId },
    args.teamId,
    {
      status: args.status.length > 0 ? args.status : undefined,
      assigneeId: args.assigneeId,
      projectId: args.projectId,
      q: args.q,
      limit: 50,
    },
  );
  return issues;
}

export async function BoardServer({
  wsSlug,
  teamId,
  filters,
}: {
  wsSlug: string;
  teamId: string;
  filters: IssueFilterState;
}) {
  const m = await requireMembership(wsSlug);
  const assigneeId =
    filters.assignee === "me" ? m.userId : filters.assignee || undefined;
  const issues = await getBoardIssues({
    userId: m.userId,
    workspaceId: m.workspaceId,
    teamId,
    status: filters.status,
    assigneeId,
    projectId: filters.project || undefined,
    q: filters.q || undefined,
  });
  return <BoardClient wsSlug={wsSlug} teamId={teamId} initialIssues={issues} />;
}
