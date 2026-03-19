import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore.ts";
import { disconnectSocket } from "../services/socket.ts";
import { stopTracking, setTrackingMode, getTrackingMode } from "../services/geolocation.ts";
import { useState } from "react";
import type { TrackingMode } from "@stay-connected/shared";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [trackMode, setTrackMode] = useState<TrackingMode>(getTrackingMode());

  const handleLogout = () => {
    stopTracking();
    disconnectSocket();
    logout();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("sc-language", lang);
  };

  const handleTrackingModeChange = (mode: TrackingMode) => {
    setTrackMode(mode);
    setTrackingMode(mode);
  };

  return (
    <div className="page">
      <h1 className="page-title">{t("settings")}</h1>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Profile</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "var(--primary)",
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700,
          }}>
            {user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{user?.name}</div>
            <div className="text-secondary" style={{ fontSize: 13 }}>{user?.phone}</div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t("language")}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { code: "en", label: "English" },
            { code: "hi", label: "हिंदी" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`btn ${i18n.language === lang.code ? "btn-primary" : "btn-outline"}`}
              style={{ flex: 1, padding: "10px 8px" }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Battery / Tracking Mode */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t("battery")}</h3>
        <p className="text-secondary" style={{ fontSize: 13, marginBottom: 12 }}>
          Lower accuracy = longer battery life
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(["high", "balanced", "low"] as TrackingMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleTrackingModeChange(mode)}
              className={`btn ${trackMode === mode ? "btn-primary" : "btn-outline"}`}
              style={{ justifyContent: "space-between" }}
            >
              <span style={{ textTransform: "capitalize" }}>{mode}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                {mode === "high" && "Every 5s (GPS)"}
                {mode === "balanced" && "Every 15s (GPS)"}
                {mode === "low" && "Every 60s (Network)"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Offline Maps */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t("download_maps")}</h3>
        <p className="text-secondary" style={{ fontSize: 13, marginBottom: 12 }}>
          Download Kumbh Mela area maps for offline use (~64 MB)
        </p>
        <button className="btn btn-outline btn-full">
          {t("download_maps")}
        </button>
      </div>

      {/* Logout */}
      <button className="btn btn-danger btn-full" onClick={handleLogout}>
        {t("logout")}
      </button>
    </div>
  );
}
