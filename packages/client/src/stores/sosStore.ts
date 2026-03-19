import { create } from "zustand";
import type { SOSAlert } from "@stay-connected/shared";

interface SOSState {
  activeAlerts: SOSAlert[];
  addAlert: (alert: SOSAlert) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  setAlerts: (alerts: SOSAlert[]) => void;
}

export const useSOSStore = create<SOSState>((set) => ({
  activeAlerts: [],
  addAlert: (alert) =>
    set((s) => ({
      activeAlerts: [alert, ...s.activeAlerts.filter((a) => a.id !== alert.id)],
    })),
  acknowledgeAlert: (alertId) =>
    set((s) => ({
      activeAlerts: s.activeAlerts.map((a) =>
        a.id === alertId ? { ...a, status: "ACKNOWLEDGED" as const } : a
      ),
    })),
  resolveAlert: (alertId) =>
    set((s) => ({
      activeAlerts: s.activeAlerts.filter((a) => a.id !== alertId),
    })),
  setAlerts: (alerts) => set({ activeAlerts: alerts }),
}));
