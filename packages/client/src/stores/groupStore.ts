import { create } from "zustand";
import type { Group } from "@stay-connected/shared";

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  setGroups: (groups: Group[]) => void;
  setActiveGroup: (groupId: string | null) => void;
  addGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  activeGroupId: null,
  setGroups: (groups) => set({ groups }),
  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  addGroup: (group) =>
    set((s) => ({ groups: [...s.groups, group] })),
  removeGroup: (groupId) =>
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) })),
}));
