/**
 * Views: filtros guardados (paridad Linear). En MVP los filtros viven en la URL
 * (CONTEXT.md); este feature sienta la estructura para persistirlos post-MVP.
 */

export interface SavedViewFilter {
  status?: string[];
  assigneeId?: string | null;
  projectId?: string | null;
  q?: string;
}

export interface SavedView {
  id: string;
  teamId: string;
  name: string;
  filters: SavedViewFilter;
  isDefault?: boolean;
}
