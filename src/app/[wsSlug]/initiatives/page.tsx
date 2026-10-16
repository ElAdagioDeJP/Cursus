import { requireMembership } from "@/auth/guards";
import { EmptyState } from "@/ui/EmptyState";

export const instant = false;

export default async function WorkspaceInitiativesPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  await requireMembership(wsSlug);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Initiatives
      </h1>
      <EmptyState
        title="Initiatives (post-MVP)"
        hint="Aún no hay iniciativas: esta sección llegará tras el MVP, sin datos de mentira."
      />
    </div>
  );
}
