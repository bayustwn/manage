import { atom, computed } from "nanostores";

export const activeProjectId = atom<string | null>(null);
export const activeBoardId = atom<string | null>(null);
export const activeTaskId = atom<string | null>(null);

export const hasActiveProject = computed(activeProjectId, (id) => id !== null);
export const hasActiveBoard = computed(activeBoardId, (id) => id !== null);
export const hasActiveTask = computed(activeTaskId, (id) => id !== null);

export function selectProject(id: string) {
  activeProjectId.set(id);
  activeBoardId.set(null);
  activeTaskId.set(null);
}

export function selectBoard(id: string) {
  activeBoardId.set(id);
  activeTaskId.set(null);
}

export function selectTask(id: string) {
  activeTaskId.set(id);
}

export function clearSelection() {
  activeProjectId.set(null);
  activeBoardId.set(null);
  activeTaskId.set(null);
}
