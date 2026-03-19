import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api.ts";

export default function KioskPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"scan" | "result" | "idle">("idle");
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!qrInput.startsWith("SC:")) {
      setError("Invalid QR code. Must start with SC:");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get kiosk location
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
        });
      });

      const { data } = await api.post("/qr/scan", {
        qrCode: qrInput,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      setResult(data);
      setMode("result");
    } catch (err: any) {
      setError(err.response?.data?.error || "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      padding: 24,
      background: "#1F2937",
      color: "white",
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        {t("kiosk_mode")}
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 32 }}>
        Volunteer Kiosk - Scan QR wristbands to update locations
      </p>

      {error && (
        <div style={{
          padding: 12,
          background: "rgba(220, 38, 38, 0.2)",
          border: "1px solid #DC2626",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {mode !== "result" && (
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block" }}>
            Enter QR Code (or scan with camera)
          </label>
          <input
            style={{
              width: "100%",
              padding: 16,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
              textAlign: "center",
              borderRadius: 12,
              border: "2px solid #4B5563",
              background: "#374151",
              color: "white",
              marginBottom: 16,
            }}
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value.toUpperCase())}
            placeholder="SC:XXXXXXXX"
          />
          <button
            onClick={handleScan}
            disabled={loading || !qrInput}
            style={{
              width: "100%",
              padding: 16,
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 12,
              background: "var(--primary)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Scanning..." : "Scan & Update Location"}
          </button>
        </div>
      )}

      {mode === "result" && result && (
        <div style={{
          padding: 24,
          background: "#374151",
          borderRadius: 16,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#x2705;</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>
            {result.assignedName}
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>
            {result.message}
          </p>
          <p style={{ fontSize: 14, opacity: 0.5 }}>
            Emergency Contact: {result.emergencyPhone}
          </p>
          {result.groups && result.groups.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, opacity: 0.7 }}>Groups:</p>
              {result.groups.map((g: any) => (
                <span key={g.id} style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  background: "var(--primary)",
                  borderRadius: 16,
                  fontSize: 13,
                  margin: 4,
                }}>
                  {g.name}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => { setMode("idle"); setQrInput(""); setResult(null); }}
            style={{
              marginTop: 24,
              padding: "12px 32px",
              borderRadius: 12,
              background: "#4B5563",
              color: "white",
              border: "none",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Scan Next
          </button>
        </div>
      )}
    </div>
  );
}
