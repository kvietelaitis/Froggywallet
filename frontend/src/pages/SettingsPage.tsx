import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UpdateProfileModal from "../_components/Users/UpdateProfileModal";
import ChangePasswordModal from "../_components/Users/ChangePasswordModal";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [openInfo, setOpenInfo] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load user");
        const json = await res.json();
        setUser(json.data);
      } catch (err) {
        setError("Unable to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="auth-container"><p>Loading...</p></div>;

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 900, margin: "20px auto", width: "100%" }}>
        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Settings</h1>

        {error && <div className="error-message">{error}</div>}

        {/* User info card */}
        <div className="card" style={{ marginBottom: "20px", display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0 }}>{user ? `${user.vardas || user.firstName || ""} ${user.pavarde || user.lastName || ""}` : "—"}</h3>
            <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)" }}>{user?.el_pastas || user?.email || ""}</p>
          </div>
        </div>

        {/* Central actions card (optional additional settings) */}
        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>Manage your application settings here.</p>

          <div style={{ maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => setOpenInfo(true)}>Update Profile</button>
            <button onClick={() => setOpenPassword(true)}>Change Password</button>
            <button onClick={async () => {
              await fetch('/api/logout', { method: 'POST', credentials: 'include' });
              navigate('/');
            }}>Log out</button>
          </div>
        </div>

        <UpdateProfileModal open={openInfo} onClose={() => setOpenInfo(false)} onUpdated={() => { /* refresh if needed */ }} />
        <ChangePasswordModal open={openPassword} onClose={() => setOpenPassword(false)} onUpdated={() => { /* refresh if needed */ }} />
      </div>
    </div>
  );
}