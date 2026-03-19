import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore.ts";
import api from "../services/api.ts";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { phone, name: "User" });
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { phone, otp });
      setAuth(data.user, data.tokens.accessToken);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>{t("login")}</h1>

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", color: "#DC2626", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleSendOTP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, display: "block" }}>{t("phone")}</label>
            <input className="input-field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "..." : t("send_otp")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, display: "block" }}>{t("otp")}</label>
            <input className="input-field" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} required style={{ letterSpacing: 8, textAlign: "center", fontSize: 24 }} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "..." : t("verify")}
          </button>
        </form>
      )}

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
        Don't have an account? <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>{t("register")}</Link>
      </p>
    </div>
  );
}
