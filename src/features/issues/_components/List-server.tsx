/** List-server (RSC): ordena por estado y sort_key para lectura densa. */
import { cacheTag } from "next/cache";
import { requireMembership } from "@/auth/guards";
import { listIssues } from "../queries";
import type { WorkflowStatus } from "../schema";
import type { IssueFilterState } from "./filters";
import { ListClient } from "./List-client";

const ORDER = ["backlog", "todo", "in_progress", "review", "done", "canceled"];

async function getListIssues(args: {
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

export async function ListServer({
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
  const issues = await getListIssues({
    userId: m.userId,
    workspaceId: m.workspaceId,
    teamId,
    status: filters.status,
    assigneeId,
    projectId: filters.project || undefined,
    q: filters.q || undefined,
  });
  const ordered = [...issues].sort(
    (a, b) =>
      ORDER.indexOf(a.status) - ORDER.indexOf(b.status) ||
      (a.sort_key < b.sort_key ? -1 : 1),
  );
  return <ListClient wsSlug={wsSlug} teamId={teamId} issues={ordered} />;
}
