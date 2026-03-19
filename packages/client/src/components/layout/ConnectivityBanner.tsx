import { useTranslation } from "react-i18next";
import { useConnectivityStore } from "../../stores/connectivityStore.ts";

export default function ConnectivityBanner() {
  const { t } = useTranslation();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const isMeshActive = useConnectivityStore((s) => s.isMeshActive);

  if (isOnline && !isMeshActive) return null;

  if (!isOnline) {
    return (
      <div className="connectivity-banner offline">
        {t("offline_mode")} - {isMeshActive ? t("mesh_active") : t("offline")}
      </div>
    );
  }

  if (isMeshActive) {
    return (
      <div className="connectivity-banner mesh">
        {t("mesh_active")}
      </div>
    );
  }

  return null;
}
