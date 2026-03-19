import { create } from "zustand";

interface ConnectivityState {
  isOnline: boolean;
  isMeshActive: boolean;
  lastOnlineAt: number | null;
  setOnline: (online: boolean) => void;
  setMeshActive: (active: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: navigator.onLine,
  isMeshActive: false,
  lastOnlineAt: navigator.onLine ? Date.now() : null,
  setOnline: (online) =>
    set({ isOnline: online, lastOnlineAt: online ? Date.now() : undefined }),
  setMeshActive: (active) => set({ isMeshActive: active }),
}));

// Listen for online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () =>
    useConnectivityStore.getState().setOnline(true)
  );
  window.addEventListener("offline", () =>
    useConnectivityStore.getState().setOnline(false)
  );
}
