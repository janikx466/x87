import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, serverTimestamp, limit } from "firebase/firestore";
import { Shield, Users, Archive, Bell, Plus, Trash2, ToggleRight, RefreshCw, Eye, Gift, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import OrbitalLoader from "@/components/OrbitalLoader";

const generateCode = () => `SGPV-${Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("")}`;

interface RedeemCode {
  id: string; code: string; value: number; plan: string; usageLimit: number; usedCount: number;
  disabled: boolean; expiry: Date | null; tag: string; note: string; createdAt: Date;
}

const AdminPanel = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "codes" | "announce" | "referrals" | "logs">("overview");
  const [stats, setStats] = useState({ users: 0, vaults: 0, newUsers24h: 0, paidUsers: 0 });
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  const [announcementText, setAnnouncementText] = useState("");
  const [announcementUrl, setAnnouncementUrl] = useState("");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);

  const [newCode, setNewCode] = useState(generateCode());
  const [newValue, setNewValue] = useState("3");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newUsageLimit, setNewUsageLimit] = useState("1");
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  // Admin check: uses Firestore isAdmin field (NOT custom claims)
  useEffect(() => {
    if (loading) return;
    if (!user || !userData) {
      navigate("/auth", { replace: true });
      return;
    }
    if (userData.isAdmin !== true) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userData, loading, navigate]);

  const isAdmin = !loading && userData?.isAdmin === true;

  // Stats
  useEffect(() => {
    if (!isAdmin) return;
    const loadStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const vaultsSnap = await getDocs(collection(db, "vaults"));
        const yesterday = new Date(Date.now() - 86400000);
        const userDocs = usersSnap.docs.map(d => d.data());
        const newUsers = userDocs.filter(u => u.createdAt?.toDate?.() > yesterday).length;
        const paid = userDocs.filter(u => u.planName !== "Free Trial").length;
        setStats({ users: usersSnap.size, vaults: vaultsSnap.size, newUsers24h: newUsers, paidUsers: paid });
      } catch (err: any) {
        console.error("Stats load error:", err);
        if (err?.message?.includes("index")) {
          toast.error("Missing Firestore index. Check console for the link to create it.");
        }
      }
    };
    loadStats();
  }, [isAdmin, tab]);

  // Announcement
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, "admin", "announcement"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAnnouncementText(d.text || "");
        setAnnouncementUrl(d.url || "");
        setAnnouncementEnabled(d.enabled || false);
      }
    }, (err) => {
      console.error("Announcement error:", err);
    });
    return () => unsub();
  }, [isAdmin]);

  // Data listeners
  useEffect(() => {
    if (!isAdmin) return;
    let unsubCodes = () => {};
    let unsubLogs = () => {};
    let unsubRefs = () => {};

    if (tab === "codes") {
      setCodesLoading(true);
      try {
        unsubCodes = onSnapshot(query(collection(db, "redeem_codes"), orderBy("createdAt", "desc")), (snap) => {
          setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
          setCodesLoading(false);
        }, (err) => {
          console.error("Codes error:", err);
          setCodesLoading(false);
          if (err?.message?.includes("index")) {
            toast.error("Missing Firestore index for redeem_codes. Check console.");
          }
        });
      } catch {
        setCodesLoading(false);
      }
    }

    if (tab === "logs") {
      unsubLogs = onSnapshot(query(collection(db, "redeem_logs"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Logs error:", err);
        if (err?.message?.includes("index")) toast.error("Missing Firestore index for redeem_logs.");
      });
    }

    if (tab === "referrals") {
      unsubRefs = onSnapshot(query(collection(db, "referrals"), orderBy("createdAt", "desc"), limit(50)), (snap) => {
        setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("Referrals error:", err);
        if (err?.message?.includes("index")) toast.error("Missing Firestore index for referrals.");
      });
    }

    return () => { unsubCodes(); unsubLogs(); unsubRefs(); };
  }, [isAdmin, tab]);

  const saveAnnouncement = async () => {
    try {
      await setDoc(doc(db, "admin", "announcement"), {
        text: announcementText, url: announcementUrl, enabled: announcementEnabled, updatedAt: serverTimestamp()
      });
      toast.success("Announcement updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save announcement");
    }
  };

  const createCode = async () => {
    if (!newCode) return;
    try {
      await addDoc(collection(db, "redeem_codes"), {
        code: newCode, value: parseFloat(newValue), plan: newPlan,
        usageLimit: parseInt(newUsageLimit), usedCount: 0, disabled: false,
        expiry: newExpiry ? new Date(newExpiry) : null, tag: newTag, note: newNote,
        createdAt: serverTimestamp(), createdBy: user?.uid,
      });
      toast.success("Code created");
      setNewCode(generateCode());
    } catch (err) {
      console.error(err);
      toast.error("Failed to create code");
    }
  };

  const toggleCode = async (id: string, current: boolean) => {
    try { await updateDoc(doc(db, "redeem_codes", id), { disabled: !current }); } catch { toast.error("Update failed"); }
  };
  const deleteCode = async (id: string) => {
    if (window.confirm("Permanent delete?")) {
      try { await deleteDoc(doc(db, "redeem_codes", id)); toast.success("Deleted"); } catch { toast.error("Delete failed"); }
    }
  };

  if (loading) return <OrbitalLoader fullScreen />;
  if (!isAdmin) return <OrbitalLoader fullScreen />;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Admin Control</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">SecretGPV Security</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>Exit to App</Button>
      </header>

      <div className="flex border-b border-border bg-card/30 overflow-x-auto no-scrollbar sticky top-[69px] z-40 backdrop-blur-sm">
        {[
          { id: "overview", icon: TrendingUp, label: "Stats" },
          { id: "codes", icon: Plus, label: "Redeem Codes" },
          { id: "announce", icon: Bell, label: "Announce" },
          { id: "referrals", icon: Gift, label: "Referrals" },
          { id: "logs", icon: Eye, label: "Audit Logs" }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${tab === t.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.users, icon: Users, color: "text-blue-accent" },
              { label: "Total Vaults", val: stats.vaults, icon: Archive, color: "text-primary" },
              { label: "New (24h)", val: stats.newUsers24h, icon: Bell, color: "text-gold" },
              { label: "Paid Users", val: stats.paidUsers, icon: Shield, color: "text-primary" }
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <s.icon className={`h-6 w-6 ${s.color} mb-4`} />
                <p className="text-4xl font-black tracking-tight">{s.val}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "codes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 sticky top-40">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                  <Plus className="h-5 w-5" /> Generate New Code
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="font-mono" />
                    <Button size="icon" variant="secondary" onClick={() => setNewCode(generateCode())}><RefreshCw className="h-4 w-4" /></Button>
                  </div>
                  <Button onClick={createCode} className="w-full">Create & Deploy</Button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-3">
              {codesLoading ? <OrbitalLoader /> : codes.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <p className="font-mono font-bold text-primary">{c.code}</p>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => toggleCode(c.id, c.disabled)}><ToggleRight className={c.disabled ? "" : "text-primary"} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCode(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "announce" && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 space-y-6">
            <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Alert Message" />
            <Input value={announcementUrl} onChange={(e) => setAnnouncementUrl(e.target.value)} placeholder="URL (optional)" />
            <div className="flex items-center justify-between">
              <span className="text-sm">Enabled</span>
              <button onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                className={`w-12 h-6 rounded-full transition-all ${announcementEnabled ? "bg-primary" : "bg-secondary"}`}>
                <div className={`h-5 w-5 rounded-full bg-foreground transition-transform ${announcementEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            <Button onClick={saveAnnouncement} className="w-full">Update Announcement</Button>
          </div>
        )}

        {tab === "referrals" && (
          <div className="space-y-3">
            {referrals.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No referrals yet</p>
            ) : referrals.map(r => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex justify-between">
                <div>
                  <p className="text-sm font-medium">{r.referredEmail || r.referredUserId}</p>
                  <p className="text-xs text-muted-foreground">Invited by {r.inviterEmail || r.inviterId}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === "paid" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No logs yet</p>
            ) : logs.map(l => (
              <div key={l.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between">
                  <p className="font-mono text-sm text-primary">{l.code}</p>
                  <p className="text-xs text-muted-foreground">{l.timestamp?.toDate?.()?.toLocaleString?.() || "—"}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">User: {l.userId}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
