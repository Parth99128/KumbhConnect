import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGroupStore } from "../stores/groupStore.ts";
import api from "../services/api.ts";
import { joinGroup } from "../services/socket.ts";

export default function GroupPage() {
  const { t } = useTranslation();
  const groups = useGroupStore((s) => s.groups);
  const setGroups = useGroupStore((s) => s.setGroups);
  const addGroup = useGroupStore((s) => s.addGroup);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/groups").then(({ data }) => setGroups(data)).catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/groups", { name: groupName, description });
      addGroup(data);
      joinGroup(data.id);
      setShowCreate(false);
      setGroupName("");
      setDescription("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post(`/groups/join/join`, { inviteCode });
      addGroup(data);
      joinGroup(data.id);
      setShowJoin(false);
      setInviteCode("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to join group");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (code: string) => {
    if (navigator.share) {
      await navigator.share({
        title: "Join my group on Stay Connected",
        text: `Join my group at Kumbh Mela! Use invite code: ${code}`,
      });
    } else {
      await navigator.clipboard.writeText(code);
      alert(`Invite code copied: ${code}`);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">{t("groups")}</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setShowJoin(false); }}>
          + {t("create_group")}
        </button>
        <button className="btn btn-outline" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
          {t("join_group")}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", color: "#DC2626", borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Create Group Form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>{t("create_group")}</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input className="input-field" placeholder={t("group_name")} value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
            <input className="input-field" placeholder={t("description")} value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? "..." : t("create_group")}
            </button>
          </form>
        </div>
      )}

      {/* Join Group Form */}
      {showJoin && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>{t("join_group")}</h3>
          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input className="input-field" placeholder={t("invite_code")} value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={6} required style={{ letterSpacing: 6, textAlign: "center", fontSize: 20, fontWeight: 700 }} />
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? "..." : t("join_group")}
            </button>
          </form>
        </div>
      )}

      {/* Group List */}
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>&#x1F465;</p>
          <p>{t("no_groups")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((group) => (
            <div key={group.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{group.name}</h3>
                  {group.description && (
                    <p className="text-secondary" style={{ fontSize: 13, marginTop: 4 }}>
                      {group.description}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t("invite_code")}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--primary)", letterSpacing: 2 }}>
                    {group.inviteCode}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="text-secondary" style={{ fontSize: 13 }}>
                  {group.members?.length || 0} {t("members")}
                </span>
                <button
                  className="btn btn-outline"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                  onClick={() => handleShare(group.inviteCode)}
                >
                  {t("share_invite")}
                </button>
              </div>

              {/* Member list */}
              {group.members && group.members.length > 0 && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  {group.members.map((member) => (
                    <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: member.role === "ADMIN" ? "var(--primary)" : "#3B82F6",
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {(member.user?.name || member.nickname || "?").charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14 }}>
                        {member.user?.name || member.nickname}
                        {member.role === "ADMIN" && (
                          <span style={{ fontSize: 11, color: "var(--primary)", marginLeft: 4 }}>Admin</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
