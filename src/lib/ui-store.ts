/** Estado UI efímero (§6). Nada de dominio aquí. */
"use client";

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  paletteOpen: boolean;
  dndActiveId: string | null;
  toggleSidebar: () => void;
  setPaletteOpen: (open: boolean) => void;
  setDndActiveId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  paletteOpen: false,
  dndActiveId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setDndActiveId: (dndActiveId) => set({ dndActiveId }),
}));
