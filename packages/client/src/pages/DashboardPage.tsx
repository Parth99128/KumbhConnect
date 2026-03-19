import { Suspense, lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocationStore } from "../stores/locationStore.ts";
import { useAuthStore } from "../stores/authStore.ts";
import { useGroupStore } from "../stores/groupStore.ts";
import { startTracking, adjustForBattery } from "../services/geolocation.ts";
import { getSocket, joinGroup } from "../services/socket.ts";
import { ShieldAlert, Users, RadioTower, Activity, HeartPulse } from "lucide-react";
import api from "../services/api.ts";

const MapView = lazy(() => import("../components/map/MapContainer.tsx"));

export interface DroneData {
  sector_id: string;
  crowd_density: number; 
  center_lat: number;
  center_lon: number;
  radius_m: number;
  timestamp: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const memberLocations = useLocationStore((s) => s.memberLocations);
  const groups = useGroupStore((s) => s.groups);
  const setGroups = useGroupStore((s) => s.setGroups);

  const [droneZones, setDroneZones] = useState<DroneData[]>([]);
  const [isConnectedToAI, setIsConnectedToAI] = useState(false);

  useEffect(() => {
    startTracking("balanced");
    adjustForBattery();
    getSocket();

    api.get("/groups").then(({ data }) => {
      setGroups(data);
      for (const group of data) {
        joinGroup(group.id);
      }
    }).catch(e => console.error("Failed to fetch groups", e));

    const aiWs = new WebSocket("ws://localhost:8001/ws/cctv");
    
    aiWs.onopen = () => setIsConnectedToAI(true);

    aiWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "density_update") {
          setDroneZones(prev => {
            const existing = prev.filter(z => z.sector_id !== data.sector_id);
            return [...existing, { ...data, timestamp: new Date().toISOString() }];
          });
        }
      } catch (err) {}
    };

    aiWs.onclose = () => setIsConnectedToAI(false);

    return () => aiWs.close();
  }, [setGroups]);

  const criticalZones = droneZones.filter(z => z.crowd_density >= 0.8);

  return (
    <div style={{ height: "calc(100dvh - 64px)", display: "flex", flexDirection: "row", overflow: "hidden", backgroundColor: "#0f172a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Sidebar: Glassmorphism Dark Theme */}
      <div style={{ 
        width: "360px", 
        display: "flex", 
        flexDirection: "column", 
        background: "rgba(30, 41, 59, 1)", 
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.8)", 
        zIndex: 10 
      }}>
        {/* Header */}
        <div style={{ padding: "28px 24px", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0) 100%)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ background: "rgba(99, 102, 241, 0.1)", padding: "10px", borderRadius: "12px", boxShadow: "0 0 16px rgba(99, 102, 241, 0.2)" }}>
              <RadioTower size={28} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, color: "#f8fafc", letterSpacing: "-0.5px" }}>NEXUS <span style={{ color: "#818cf8" }}>AI</span></h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px", fontWeight: 500, paddingLeft: "52px" }}>Kumbh Command Center</p>
        </div>

        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          
          {/* Status Metric Card */}
          <div style={{ backgroundColor: "rgba(15, 23, 42, 0.8)", borderRadius: "16px", padding: "20px", marginBottom: "28px", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "15px" }}>
                <Activity size={18} color="#38bdf8" />
                Drone Uplink
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isConnectedToAI ? "#10b981" : "#ef4444", boxShadow: isConnectedToAI ? "0 0 12px #10b981" : "0 0 12px #ef4444" }} />
                <span style={{ fontSize: "12px", fontWeight: "700", color: isConnectedToAI ? "#10b981" : "#ef4444", letterSpacing: "1px" }}>
                  {isConnectedToAI ? 'ACTIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "44px", fontWeight: 800, margin: 0, color: "#f1f5f9", lineHeight: 1 }}>{droneZones.length}</p>
              <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#475569", margin: 0, marginTop: "8px", fontWeight: 700 }}>Hotspots Tracked</p>
            </div>
          </div>

          {/* Alert Protocol Card */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontWeight: "700", textTransform: "uppercase", fontSize: "13px", letterSpacing: "1.2px", marginBottom: "16px" }}>
              <ShieldAlert size={18} /> Threat Assessment
            </h2>
            {criticalZones.length === 0 ? (
              <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                <p style={{ fontSize: "14px", color: "#34d399", margin: 0, fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>✓</span> Sectors Operating Normally
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {criticalZones.map(zone => (
                  <div key={zone.sector_id} style={{ 
                    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0) 100%)", 
                    border: "1px solid rgba(239, 68, 68, 0.3)", 
                    borderRadius: "12px", 
                    padding: "16px", 
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <p style={{ fontWeight: "800", color: "#fca5a5", margin: 0, fontSize: "15px" }}>Sector {zone.sector_id.split('-')[1] || zone.sector_id}</p>
                      <span style={{ background: "#ef4444", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold", letterSpacing: "0.5px" }}>CRITICAL</span>
                    </div>
                    <p style={{ fontSize: "16px", color: "#f87171", fontWeight: 700, margin: "0 0 6px 0" }}>Density: {(zone.crowd_density * 100).toFixed(0)}%</p>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Evacuation Radius: <span style={{ color: "#f8fafc" }}>{zone.radius_m}m</span></p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personnel Metrics */}
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#818cf8", fontWeight: "700", textTransform: "uppercase", fontSize: "13px", letterSpacing: "1.2px", marginBottom: "16px" }}>
              <Users size={18} /> Field Deployment
            </h2>
            <div style={{ backgroundColor: "rgba(99, 102, 241, 0.05)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "16px" }}>
                 <span style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8" }}>Registered Squads</span>
                 <span style={{ backgroundColor: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", fontSize: "14px", padding: "4px 12px", borderRadius: "8px", fontWeight: "800" }}>{groups.length}</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <span style={{ fontSize: "14px", fontWeight: 600, color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px" }}>
                   <HeartPulse size={16} color="#fb7185" /> Live Signals
                 </span>
                 <span style={{ color: "#f8fafc", fontWeight: "800", fontSize: "20px" }}>{Object.keys(memberLocations).length}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Viewer with Dark Vignette overlay */}
      <div style={{ flex: 1, position: "relative", backgroundColor: "#020617" }}>
        
        {/* CSS Vignette purely for aesthetic blending */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 10, boxShadow: "inset 0 0 120px rgba(15, 23, 42, 0.8)" }} />
        
        <Suspense fallback={
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid rgba(99, 102, 241, 0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
            <span style={{ fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", fontSize: "12px", color: "#64748b" }}>INITIALIZING CARTOGRAPHY...</span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        }>
          <MapView droneZones={droneZones} />
        </Suspense>
      </div>
    </div>
  );
}
