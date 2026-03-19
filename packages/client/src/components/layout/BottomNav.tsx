import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSOSStore } from "../../stores/sosStore.ts";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const alertCount = useSOSStore((s) => s.activeAlerts.length);

  const tabs = [
    { path: "/", label: t("map"), icon: "M" },
    { path: "/groups", label: t("groups"), icon: "G" },
    { path: "/sos", label: t("sos"), icon: "!" },
    { path: "/meeting", label: t("meeting_points"), icon: "P" },
    { path: "/settings", label: t("settings"), icon: "S" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0",
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        const isSOS = tab.path === "/sos";

        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              fontSize: 11,
              fontWeight: isActive ? 700 : 500,
              position: "relative",
              padding: "4px 12px",
            }}
          >
            <span
              style={{
                fontSize: isSOS ? 24 : 20,
                width: isSOS ? 48 : 32,
                height: isSOS ? 48 : 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: isSOS ? "var(--danger)" : "transparent",
                color: isSOS ? "white" : undefined,
                fontWeight: 700,
              }}
            >
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {isSOS && alertCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: 2,
                  background: "var(--danger)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {alertCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
