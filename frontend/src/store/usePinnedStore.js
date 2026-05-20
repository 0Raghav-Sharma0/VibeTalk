import { create } from "zustand";
import { normId } from "../utils/messageHelpers.js";

const STORAGE_PREFIX = "nexaura:pinned:";

function loadPinned(ownerId) {
  if (!ownerId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${ownerId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normId) : [];
  } catch {
    return [];
  }
}

function savePinned(ownerId, ids) {
  if (!ownerId || typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${ownerId}`, JSON.stringify(ids));
}

export const usePinnedStore = create((set, get) => ({
  pinnedIds: [],
  ownerId: null,

  hydrate: (ownerId) => {
    const id = normId(ownerId);
    if (!id) return;
    if (get().ownerId === id && get().pinnedIds.length >= 0) {
      const stored = loadPinned(id);
      if (stored.join() !== get().pinnedIds.join()) {
        set({ pinnedIds: stored, ownerId: id });
      }
      return;
    }
    set({ ownerId: id, pinnedIds: loadPinned(id) });
  },

  isPinned: (userId) => {
    const id = normId(userId);
    return get().pinnedIds.includes(id);
  },

  togglePin: (userId) => {
    const id = normId(userId);
    const { ownerId, pinnedIds } = get();
    if (!ownerId) return;

    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((p) => p !== id)
      : [id, ...pinnedIds];

    savePinned(ownerId, next);
    set({ pinnedIds: next });
  },

  clear: () => set({ pinnedIds: [], ownerId: null }),
}));
