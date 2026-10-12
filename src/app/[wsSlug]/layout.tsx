import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { requireMembership } from "@/auth/guards";
import { listTeams } from "@/features/teams/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { Skeleton } from "@/ui/Skeleton";
import { ClientShell } from "./ClientShell-client";
import { Sidebar } from "./Sidebar-client";

async function WorkspaceChrome({
  params,
  children,
}: {
  params: Promise<{ wsSlug: string }>;
  children: React.ReactNode;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const ws = await getWorkspaceBySlug(wsSlug);
  if (!ws) notFound();
  const teams = await listTeams(m.workspaceId);
  return (
    <div className="flex min-h-screen bg-cursus-bg">
      <Sidebar wsSlug={wsSlug} workspaceName={ws.name} teams={teams} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ wsSlug: string }>;
}) {
  return (
    <NuqsAdapter>
      <Suspense
        fallback={
          <div
            className="flex min-h-screen"
            role="status"
            aria-label="Cargando workspace"
          >
            <div
              className="flex w-60 shrink-0 flex-col gap-2 border-r border-cursus-border bg-cursus-surface p-3"
              aria-hidden="true"
            >
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
              <Skeleton className="h-7 w-48" />
              <div className="mt-4 flex gap-3">
                <Skeleton className="h-[300px] w-72 rounded-lg" />
                <Skeleton className="h-[300px] w-72 rounded-lg" />
                <Skeleton className="h-[300px] w-72 rounded-lg" />
              </div>
              <span className="sr-only">Cargando workspace…</span>
            </main>
          </div>
        }
      >
        <WorkspaceChrome params={params}>{children}</WorkspaceChrome>
      </Suspense>
      <ClientShell />
    </NuqsAdapter>
  );
}
