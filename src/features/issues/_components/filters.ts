/** Parsers nuqs compartidos (URL linkeable ?status=&assignee=&project=&q=). */
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

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
