import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function WelcomePage() {
  const { t, i18n } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #FF6B00, #FF8C38)",
        color: "white",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>
        <span role="img" aria-label="connected">&#x1F91D;</span>
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        {t("app_name")}
      </h1>
      <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 40, maxWidth: 300 }}>
        {t("tagline")}
      </p>

      {/* Language selection */}
      <div style={{ marginBottom: 32, display: "flex", gap: 12 }}>
        <button
          onClick={() => {
            i18n.changeLanguage("en");
            localStorage.setItem("sc-language", "en");
          }}
          style={{
            padding: "8px 20px",
            borderRadius: 20,
            background: i18n.language === "en" ? "white" : "rgba(255,255,255,0.2)",
            color: i18n.language === "en" ? "#FF6B00" : "white",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          English
        </button>
        <button
          onClick={() => {
            i18n.changeLanguage("hi");
            localStorage.setItem("sc-language", "hi");
          }}
          style={{
            padding: "8px 20px",
            borderRadius: 20,
            background: i18n.language === "hi" ? "white" : "rgba(255,255,255,0.2)",
            color: i18n.language === "hi" ? "#FF6B00" : "white",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          हिंदी
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
        <Link
          to="/register"
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            background: "white",
            color: "#FF6B00",
            fontWeight: 700,
            fontSize: 18,
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          {t("register")}
        </Link>
        <Link
          to="/login"
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.2)",
            color: "white",
            fontWeight: 600,
            fontSize: 18,
            textDecoration: "none",
            textAlign: "center",
            border: "2px solid rgba(255,255,255,0.4)",
          }}
        >
          {t("login")}
        </Link>
      </div>

      <p style={{ marginTop: 32, fontSize: 13, opacity: 0.7 }}>
        Register your group before the event
      </p>
    </div>
  );
}
