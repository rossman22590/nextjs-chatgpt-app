import { create } from 'zustand';

/**
 * Client-side cache of the admin-disabled model ids.
 *
 * Populated once at app load (and on a slow poll) from the public `admin.getDisabledModels`
 * query. Consumed by the model-selector filter (hard-hides disabled models) and by the admin
 * Models panel. This is a HARD, non-user-overridable hide - distinct from per-user `userHidden`.
 */

interface AdminModelsStore {
  disabledIds: Set<string>;
  loaded: boolean;
  setDisabledIds: (ids: string[]) => void;
}

export const useAdminModelsStore = create<AdminModelsStore>((set) => ({
  disabledIds: new Set<string>(),
  loaded: false,
  setDisabledIds: (ids: string[]) => set({ disabledIds: new Set(ids), loaded: true }),
}));

/** Non-reactive getter for use inside pure utils / hot paths. */
export function isModelAdminDisabled(modelId: string | null | undefined): boolean {
  if (!modelId) return false;
  return useAdminModelsStore.getState().disabledIds.has(modelId);
}

export function adminModelsSetDisabledIds(ids: string[]): void {
  useAdminModelsStore.getState().setDisabledIds(ids);
}
