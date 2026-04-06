import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, serverTimestamp, where } from "firebase/firestore";
import { Shield, Users, Archive, Bell, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";

const generateCode = () => `SGPV-${Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("")}`;

interface RedeemCode {
  id: string; code: string; value: number; plan: string; usageLimit: number; usedCount: number;
  disabled: boolean; expiry: Date | null; tag: string; note: string; createdAt: Date;
}

const AdminPanel = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "codes" | "announce" | "logs">("overview");
  const [stats, setStats] = useState({ users: 0, vaults: 0, newUsers24h: 0 });
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementUrl, setAnnouncementUrl] = useState("");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);

  // New code form
  const [newCode, setNewCode] = useState(generateCode());
  const [newValue, setNewValue] = useState("3");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newUsageLimit, setNewUsageLimit] = useState("1");
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) navigate("/", { replace: true });
  }, [user, userData, loading, navigate]);

  // Load stats
  useEffect(() => {
    if (!userData?.isAdmin) return;
    const loadStats = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const vaultsSnap = await getDocs(collection(db, "vaults"));
      const yesterday = new Date(Date.now() - 86400000);
      const newUsers = usersSnap.docs.filter(d => d.data().createdAt?.toDate?.() > yesterday).length;
      setStats({ users: usersSnap.size, vaults: vaultsSnap.size, newUsers24h: newUsers });
    };
    loadStats();
  }, [userData]);

  // Load announcement
  useEffect(() => {
    if (!userData?.isAdmin) return;
    const unsub = onSnapshot(doc(db, "admin", "announcement"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAnnouncementText(d.text || "");
        setAnnouncementUrl(d.url || "");
        setAnnouncementEnabled(d.enabled || false);
      }
    });
    return () => unsub();
  }, [userData]);

  // Load codes
  useEffect(() => {
    if (!userData?.isAdmin || tab !== "codes") return;
    setCodesLoading(true);
    const unsub = onSnapshot(query(collection(db, "redeem_codes"), orderBy("createdAt", "desc")), (snap) => {
      setCodes(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, code: data.code, value: data.value, plan: data.plan,
          usageLimit: data.usageLimit, usedCount: data.usedCount || 0,
          disabled: data.disabled || false, expiry: data.expiry?.toDate?.() || null,
          tag: data.tag || "", note: data.note || "", createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      }));
      setCodesLoading(false);
    });
    return () => unsub();
  }, [userData, tab]);

  // Load logs
  useEffect(() => {
    if (!userData?.isAdmin || tab !== "logs") return;
    const unsub = onSnapshot(query(collection(db, "redeem_logs"), orderBy("timestamp", "desc")), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userData, tab]);

  const saveAnnouncement = async () => {
    await setDoc(doc(db, "admin", "announcement"), { text: announcementText, url: announcementUrl, enabled: announcementEnabled });
  };

  const createCode = async () => {
    await addDoc(collection(db, "redeem_codes"), {
      code: newCode, value: parseFloat(newValue), plan: newPlan,
      usageLimit: parseInt(newUsageLimit), usedCount: 0, disabled: false,
      expiry: newExpiry ? new Date(newExpiry) : null, tag: newTag, note: newNote,
      createdAt: serverTimestamp(), createdBy: user?.uid,
    });
    setNewCode(generateCode());
    setNewTag(""); setNewNote(""); setNewExpiry("");
  };

  const toggleCode = async (c: RedeemCode) => updateDoc(doc(db, "redeem_codes", c.id), { disabled: !c.disabled });
  const deleteCode = async (c: RedeemCode) => deleteDoc(doc(db, "redeem_codes", c.id));

  if (loading) return <OrbitalLoader fullScreen />;

  const getStatus = (c: RedeemCode) => {
    if (c.disabled) return "Disabled";
    if (c.expiry && c.expiry < new Date()) return "Expired";
    if (c.usedCount >= c.usageLimit) return "Used";
    return "Active";
  };

  const statusColor = (s: string) => {
    if (s === "Active") return "text-primary";
    if (s === "Disabled") return "text-muted-foreground";
    if (s === "Expired") return "text-gold";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
      </header>

      <div className="flex border-b border-border overflow-x-auto">
        {(["overview", "codes", "announce", "logs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm capitalize whitespace-nowrap border-b-2 transition-all ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Users className="h-8 w-8 mx-auto text-blue-accent mb-2" />
              <p className="text-3xl font-bold">{stats.users}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Archive className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-3xl font-bold">{stats.vaults}</p>
              <p className="text-sm text-muted-foreground">Total Vaults</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Bell className="h-8 w-8 mx-auto text-gold mb-2" />
              <p className="text-3xl font-bold">{stats.newUsers24h}</p>
              <p className="text-sm text-muted-foreground">New (24h)</p>
            </div>
          </div>
        )}

        {tab === "codes" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Create Code</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Code</label>
                  <div className="flex gap-1">
                    <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} className="font-mono text-sm" />
                    <Button size="icon" variant="outline" onClick={() => setNewCode(generateCode())}><RefreshCw className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Plan</label>
                  <div className="flex gap-1">
                    {["Pro", "Premium"].map(p => (
                      <button key={p} onClick={() => { setNewPlan(p); setNewValue(p === "Pro" ? "3" : "7"); }}
                        className={`flex-1 py-2 rounded-lg text-sm border ${newPlan === p ? "border-primary bg-primary/10" : "border-border"}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Value ($)</label>
                  <Input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Usage Limit</label>
                  <Input type="number" value={newUsageLimit} onChange={(e) => setNewUsageLimit(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tag</label>
                  <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="promo, VIP..." />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Expiry</label>
                  <Input type="datetime-local" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
                </div>
              </div>
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Note (internal)" />
              <Button onClick={createCode} className="w-full">Create Code</Button>
            </div>

            {codesLoading ? <OrbitalLoader size="sm" /> : (
              <div className="space-y-2">
                {codes.map(c => {
                  const status = getStatus(c);
                  return (
                    <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold">{c.code}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{c.plan}</span>
                          <span>${c.value}</span>
                          <span className={statusColor(status)}>{status}</span>
                          <span>{c.usedCount}/{c.usageLimit}</span>
                          {c.tag && <span className="bg-secondary px-2 py-0.5 rounded">{c.tag}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => toggleCode(c)}>
                          {c.disabled ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4 text-primary" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteCode(c)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "announce" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="font-semibold">Global Announcement</h3>
            <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Announcement text" />
            <Input value={announcementUrl} onChange={(e) => setAnnouncementUrl(e.target.value)} placeholder="URL (optional)" />
            <div className="flex items-center justify-between">
              <span className="text-sm">Enabled</span>
              <button onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                className={`w-12 h-6 rounded-full transition-all ${announcementEnabled ? "bg-primary" : "bg-secondary"}`}>
                <div className={`h-5 w-5 rounded-full bg-foreground transition-transform ${announcementEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            <Button onClick={saveAnnouncement} className="w-full">Save</Button>
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-2">
            {logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No logs yet</p> :
              logs.map(l => (
                <div key={l.id} className="bg-card border border-border rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs">{l.code}</span>
                    <span className="text-xs text-muted-foreground">{l.timestamp?.toDate?.().toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">User: {l.userId?.slice(0, 12)}...</p>
                  {l.suspicious && <p className="text-xs text-destructive">⚠️ Suspicious</p>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
