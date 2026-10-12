/** Tarjeta de incidencia (presentacional). El drag la envuelve Board-client. */
import Link from "next/link";
import type { IssueListRow } from "@/db/types";
import { cn } from "@/lib/cn";
import { issueDetail } from "@/lib/routes";
import { Avatar } from "@/ui/Avatar";
import { PriorityMark } from "@/ui/Badge";

export function IssueCard({
  issue,
  wsSlug,
  teamId,
  dragProps,
  dragging,
}: {
  issue: IssueListRow;
  wsSlug: string;
  teamId: string;
  dragProps?: React.HTMLAttributes<HTMLElement>;
  dragging?: boolean;
}) {
  return (
    <article
      {...dragProps}
      className={cn(
        "rounded-lg border border-cursus-border bg-cursus-surface p-2.5 transition-opacity duration-150",
        dragging && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-cursus-text-2">
          {issue.identifier}
        </span>
        <PriorityMark priority={issue.priority} />
      </div>
      <Link
        href={issueDetail(wsSlug, teamId, issue.id)}
        className="mt-1 line-clamp-2 block text-sm font-medium leading-snug text-cursus-text-1 hover:underline"
      >
        {issue.title}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="flex flex-wrap gap-1">
          {issue.label_names?.slice(0, 3).map((l) => (
            <span
              key={l}
              className="rounded-full bg-cursus-surface-2 px-1.5 py-px text-[11px] text-cursus-text-2"
            >
              {l}
            </span>
          ))}
        </span>
        <Avatar name={issue.assignee_name} />
      </div>
    </article>
  );
}
