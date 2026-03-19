import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocationStore } from "../stores/locationStore.ts";
import { useGroupStore } from "../stores/groupStore.ts";
import { useSOSStore } from "../stores/sosStore.ts";
import { emitSOS, emitSOSAck } from "../services/socket.ts";
import { formatDistance } from "@stay-connected/shared";

export default function SOSPage() {
  const { t } = useTranslation();
  const myLocation = useLocationStore((s) => s.myLocation);
  const groups = useGroupStore((s) => s.groups);
  const activeAlerts = useSOSStore((s) => s.activeAlerts);
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSOS = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    if (!myLocation) {
      alert(t("no_location"));
      return;
    }

    // Send SOS to all groups
    for (const group of groups) {
      emitSOS({
        groupId: group.id,
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        severity: "HIGH",
        message: t("sos_message"),
      });
    }

    setSent(true);
    setConfirming(false);

    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="page" style={{ textAlign: "center" }}>
      <h1 className="page-title">{t("sos")}</h1>

      {/* Big SOS Button */}
      <div style={{ margin: "32px 0" }}>
        <button
          onClick={handleSOS}
          className={confirming ? "sos-pulse" : ""}
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: sent ? "var(--success)" : "var(--danger)",
            color: "white",
            fontSize: confirming ? 18 : 40,
            fontWeight: 800,
            border: "6px solid white",
            boxShadow: "0 4px 20px rgba(220, 38, 38, 0.4)",
            transition: "all 0.3s",
          }}
        >
          {sent ? "SENT!" : confirming ? t("sos_confirm") : "SOS"}
        </button>
      </div>

      {confirming && (
        <button
          onClick={() => setConfirming(false)}
          style={{ color: "var(--text-secondary)", background: "none", fontSize: 14 }}
        >
          Cancel
        </button>
      )}

      {sent && (
        <p style={{ color: "var(--success)", fontWeight: 600, marginTop: 8 }}>
          {t("sos_sent")}
        </p>
      )}

      {/* Active SOS Alerts from others */}
      {activeAlerts.length > 0 && (
        <div style={{ marginTop: 32, textAlign: "left" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Active Alerts ({activeAlerts.length})
          </h2>
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="card"
              style={{
                marginBottom: 8,
                borderLeft: `4px solid ${alert.severity === "HIGH" ? "var(--danger)" : "var(--warning)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <strong>{alert.senderName}</strong>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: alert.severity === "HIGH" ? "#FEE2E2" : "#FEF3C7",
                      color: alert.severity === "HIGH" ? "var(--danger)" : "#92400E",
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>
                {alert.distanceFromYou != null && (
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                    {formatDistance(alert.distanceFromYou)}
                  </span>
                )}
              </div>
              {alert.message && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  {alert.message}
                </p>
              )}
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                {alert.status === "ACTIVE" && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: "6px 16px", fontSize: 13 }}
                    onClick={() => emitSOSAck(alert.id)}
                  >
                    I'm coming to help
                  </button>
                )}
                {alert.status === "ACKNOWLEDGED" && (
                  <span style={{ fontSize: 13, color: "var(--success)" }}>
                    Help is on the way
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
