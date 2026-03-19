import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import BottomNav from "./BottomNav.tsx";
import ConnectivityBanner from "./ConnectivityBanner.tsx";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <ConnectivityBanner />
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
      <BottomNav />
    </div>
  );
}
