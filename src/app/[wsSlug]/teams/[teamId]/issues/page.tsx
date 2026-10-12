import { redirect } from "next/navigation";
import { teamBoard } from "@/lib/routes";

export default async function TeamIssuesRedirect({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
}) {
  const { wsSlug, teamId } = await params;
  redirect(teamBoard(wsSlug, teamId));
}
