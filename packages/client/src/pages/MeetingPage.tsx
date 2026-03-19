import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGroupStore } from "../stores/groupStore.ts";
import { formatDistance } from "@stay-connected/shared";
import api from "../services/api.ts";
import type { MeetingPoint } from "@stay-connected/shared";

export default function MeetingPage() {
  const { t } = useTranslation();
  const groups = useGroupStore((s) => s.groups);
  const activeGroupId = useGroupStore((s) => s.activeGroupId) || groups[0]?.id;

  const [predefined, setPredefined] = useState<MeetingPoint[]>([]);
  const [optimal, setOptimal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/meeting-points/predefined")
      .then(({ data }) => setPredefined(data))
      .catch(console.error);
  }, []);

  const handleFindOptimal = async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const { data } = await api.post("/meeting-points/suggest-optimal", {
        groupId: activeGroupId,
      });
      setOptimal(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">{t("meeting_points")}</h1>

      {/* Find best meeting point */}
      <div className="card" style={{ marginBottom: 16, background: "#FFF7ED" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          {t("find_optimal")}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
          Find the best meeting point closest to all group members
        </p>
        <button
          className="btn btn-primary btn-full"
          onClick={handleFindOptimal}
          disabled={loading || !activeGroupId}
        >
          {loading ? "Finding..." : t("find_optimal")}
        </button>

        {optimal && (
          <div style={{ marginTop: 16, padding: 12, background: "white", borderRadius: 8 }}>
            <strong style={{ color: "var(--primary)" }}>{optimal.name}</strong>
            {optimal.memberDistances && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                {optimal.memberDistances.map((md: any) => (
                  <div key={md.userId} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span>{md.name}</span>
                    <span style={{ fontWeight: 600 }}>{formatDistance(md.distanceMeters)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Predefined meeting points */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        Kumbh Mela Meeting Points
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {predefined.map((point) => (
          <div key={point.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <strong style={{ fontSize: 15 }}>{point.name}</strong>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  {point.description}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 12,
                  background:
                    point.type === "EMERGENCY"
                      ? "#FEE2E2"
                      : point.type === "LANDMARK"
                      ? "#EDE9FE"
                      : "#ECFDF5",
                  color:
                    point.type === "EMERGENCY"
                      ? "#DC2626"
                      : point.type === "LANDMARK"
                      ? "#7C3AED"
                      : "#16A34A",
                  fontWeight: 600,
                }}
              >
                {point.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
