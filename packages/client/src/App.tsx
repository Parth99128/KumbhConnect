import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore.ts";
import AppShell from "./components/layout/AppShell.tsx";

const WelcomePage = lazy(() => import("./pages/WelcomePage.tsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.tsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const GroupPage = lazy(() => import("./pages/GroupPage.tsx"));
const SOSPage = lazy(() => import("./pages/SOSPage.tsx"));
const MeetingPage = lazy(() => import("./pages/MeetingPage.tsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.tsx"));
const KioskPage = lazy(() => import("./pages/KioskPage.tsx"));

function RouteFallback() {
  return (
    <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>
      Loading...
    </div>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => !!s.token);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupPage />} />
          <Route path="/sos" element={<SOSPage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
