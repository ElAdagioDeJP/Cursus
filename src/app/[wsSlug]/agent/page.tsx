import { requireMembership } from "@/auth/guards";
import { AgentClient } from "./AgentClient-client";

export default async function WorkspaceAgentPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  await requireMembership(wsSlug);
  return <AgentClient wsSlug={wsSlug} />;
}
