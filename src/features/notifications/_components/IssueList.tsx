/** Lista presentacional de issues (RSC, sin estado). */
import Link from "next/link";
import type { IssueListRow } from "@/db/types";
import { issueDetail } from "@/lib/routes";
import { Avatar } from "@/ui/Avatar";
import { PriorityMark } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";

export function IssueList({
  wsSlug,
  issues,
  emptyTitle,
  emptyHint,
}: {
  wsSlug: string;
  issues: IssueListRow[];
  emptyTitle: string;
  emptyHint: string;
}) {
  if (issues.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }
  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue) => (
        <li
          key={issue.id}
          className="flex items-center gap-3 rounded-lg border border-cursus-border bg-cursus-surface p-3 text-sm"
        >
          <span className="shrink-0 font-mono text-xs text-cursus-text-3">
            {issue.identifier}
          </span>
          <span className="min-w-0 flex-1 truncate">
            <Link
              href={issueDetail(wsSlug, issue.team_id, issue.id)}
              className="font-medium text-cursus-text-1 hover:underline"
            >
              {issue.title}
            </Link>
            <span className="ml-2 font-mono text-xs text-cursus-text-3">
              {issue.status}
            </span>
          </span>
          <PriorityMark priority={issue.priority} />
          <Avatar name={issue.assignee_name} />
        </li>
      ))}
    </ul>
  );
}
