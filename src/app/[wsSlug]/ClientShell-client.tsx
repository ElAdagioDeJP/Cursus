/** Montaje cliente de paleta + atajos (dynamic ssr:false vive aquí, no en el RSC). */
"use client";

import dynamic from "next/dynamic";

const CommandPalette = dynamic(
  () =>
    import("@/features/issues/_components/CommandPalette-client").then(
      (m) => m.CommandPalette,
    ),
  { ssr: false },
);
const Hotkeys = dynamic(
  () =>
    import("@/features/issues/_components/Hotkeys-client").then(
      (m) => m.Hotkeys,
    ),
  { ssr: false },
);

export function ClientShell() {
  return (
    <>
      <Hotkeys />
      <CommandPalette />
    </>
  );
}
