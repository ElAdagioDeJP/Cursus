/** Parsers nuqs compartidos (URL linkeable ?status=&assignee=&project=&q=). */
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import type { IssueListRow } from "@/db/types";
import type { WorkflowStatus } from "../schema";

export const STATUS_VALUES = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "canceled",
] as const;

export const filterParsers = {
  status: parseAsArrayOf(parseAsStringLiteral(STATUS_VALUES)).withDefault([]),
  assignee: parseAsString.withDefault(""),
  project: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
};

export const loadIssueFilters = createLoader(filterParsers);
export type IssueFilterState = Awaited<ReturnType<typeof loadIssueFilters>>;

/** Orden de grupos Linear: In Review, Todo, Backlog primero; resto después. */
export const GROUP_ORDER: WorkflowStatus[] = [
  "review",
  "todo",
  "backlog",
  "in_progress",
  "done",
  "canceled",
];

/** Grupos siempre visibles (aunque estén vacíos): In Review, Todo, Backlog. */
const PINNED_GROUPS: WorkflowStatus[] = ["review", "todo", "backlog"];

export interface IssueGroup {
  status: WorkflowStatus;
  issues: IssueListRow[];
}

/** Agrupa por estado en orden GROUP_ORDER, cada grupo por sort_key. */
export function groupIssuesByStatus(issues: IssueListRow[]): IssueGroup[] {
  const by = new Map<WorkflowStatus, IssueListRow[]>();
  for (const issue of issues) {
    const arr = by.get(issue.status);
    if (arr) arr.push(issue);
    else by.set(issue.status, [issue]);
  }
  return GROUP_ORDER.map((status) => ({
    status,
    issues: (by.get(status) ?? [])
      .slice()
      .sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1)),
  })).filter(
    (group) => PINNED_GROUPS.includes(group.status) || group.issues.length > 0,
  );
}
