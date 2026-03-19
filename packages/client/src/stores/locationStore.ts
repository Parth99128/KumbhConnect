import { create } from "zustand";
import type { MemberLocation, GeoPosition } from "@stay-connected/shared";

interface LocationState {
  myLocation: GeoPosition | null;
  memberLocations: Map<string, MemberLocation>;
  setMyLocation: (pos: GeoPosition) => void;
  updateMemberLocation: (loc: MemberLocation) => void;
  setAllMemberLocations: (locs: MemberLocation[]) => void;
  clearMemberLocations: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  myLocation: null,
  memberLocations: new Map(),
  setMyLocation: (pos) => set({ myLocation: pos }),
  updateMemberLocation: (loc) =>
    set((s) => {
      const updated = new Map(s.memberLocations);
      updated.set(loc.userId, loc);
      return { memberLocations: updated };
    }),
  setAllMemberLocations: (locs) =>
    set(() => {
      const map = new Map<string, MemberLocation>();
      for (const loc of locs) {
        map.set(loc.userId, loc);
      }
      return { memberLocations: map };
    }),
  clearMemberLocations: () => set({ memberLocations: new Map() }),
}));
