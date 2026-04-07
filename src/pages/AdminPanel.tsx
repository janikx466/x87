import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy, doc, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, serverTimestamp, where, limit } from "firebase/firestore";
import { Shield, Users, Archive, Bell, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Eye, Gift, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";

// Premium Code Generator
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

  // New code form states
  const [newCode, setNewCode] = useState(generateCode());
  const [newValue, setNewValue] = useState("3");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newUsageLimit, setNewUsageLimit] = useState("1");
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  // Safety Redirect: Only admin can enter
  useEffect(() => {
    if (!loading && (!user || !userData?.isAdmin)) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, userData, loading, navigate]);

  // Real-time Stats Loader
  useEffect(() => {
    if (!userData?.isAdmin) return;
    const loadStats = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const vaultsSnap = await getDocs(collection(db, "vaults"));
      const yesterday = new Date(Date.now() - 86400000);
      
      const userDocs = usersSnap.docs.map(d => d.data());
      const newUsers = userDocs.filter(u => u.createdAt?.toDate?.() > yesterday).length;
      const paid = userDocs.filter(u => u.planName !== "Free Trial").length;

      setStats({ 
        users: usersSnap.size, 
        vaults: vaultsSnap.size, 
        newUsers24h: newUsers,
        paidUsers: paid 
      });
    };
    loadStats();
  }, [userData, tab]);

  // Announcement Sync
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

  // Data Listeners (Codes, Logs, Referrals)
  useEffect(() => {
    if (!userData?.isAdmin) return;
    
    let unsubCodes = () => {};
    let unsubLogs = () => {};
    let unsubRefs = () => {};

    if (tab === "codes") {
      setCodesLoading(true);
      unsubCodes = onSnapshot(query(collection(db, "redeem_codes"), orderBy("createdAt", "desc")), (snap) => {
        setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
        setCodesLoading(false);
      });
    }

    if (tab === "logs") {
      unsubLogs = onSnapshot(query(collection(db, "redeem_logs"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    if (tab === "referrals") {
      unsubRefs = onSnapshot(query(collection(db, "referrals"), orderBy("createdAt", "desc"), limit(50)), (snap) => {
        setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => { unsubCodes(); unsubLogs(); unsubRefs(); };
  }, [userData, tab]);

  // Actions
  const saveAnnouncement = async () => {
    await setDoc(doc(db, "admin", "announcement"), { 
      text: announcementText, 
      url: announcementUrl, 
      enabled: announcementEnabled,
      updatedAt: serverTimestamp()
    });
  };

  const createCode = async () => {
    if (!newCode) return;
    await addDoc(collection(db, "redeem_codes"), {
      code: newCode, value: parseFloat(newValue), plan: newPlan,
      usageLimit: parseInt(newUsageLimit), usedCount: 0, disabled: false,
      expiry: newExpiry ? new Date(newExpiry) : null, tag: newTag, note: newNote,
      createdAt: serverTimestamp(), createdBy: user?.uid,
    });
    setNewCode(generateCode());
    setNewTag(""); setNewNote(""); setNewExpiry("");
  };

  const toggleCode = async (id: string, current: boolean) => updateDoc(doc(db, "redeem_codes", id), { disabled: !current });
  const deleteCode = async (id: string) => {
    if (window.confirm("Are you sure? This code will be permanently removed.")) {
      await deleteDoc(doc(db, "redeem_codes", id));
    }
  };

  if (loading) return <OrbitalLoader fullScreen />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Premium Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Admin Control</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">SecretGPV Security</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => navigate("/dashboard")}>
          Exit to App
        </Button>
      </header>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 bg-black/10 overflow-x-auto no-scrollbar sticky top-[69px] z-40 backdrop-blur-sm">
        {[
          { id: "overview", icon: TrendingUp, label: "Stats" },
          { id: "codes", icon: Plus, label: "Redeem Codes" },
          { id: "announce", icon: Bell, label: "Announce" },
          { id: "referrals", icon: Gift, label: "Referrals" },
          { id: "logs", icon: Eye, label: "Audit Logs" }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${tab === t.id ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
        
        {/* TAB: OVERVIEW */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.users, icon: Users, color: "text-blue-400" },
              { label: "Total Vaults", val: stats.vaults, icon: Archive, color: "text-primary" },
              { label: "New (24h)", val: stats.newUsers24h, icon: Bell, color: "text-yellow-400" },
              { label: "Paid Users", val: stats.paidUsers, icon: Shield, color: "text-green-400" }
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-colors">
                <s.icon className={`h-6 w-6 ${s.color} mb-4`} />
                <p className="text-4xl font-black tracking-tight">{s.val}</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB: CODES */}
        {tab === "codes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sticky top-40">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                  <Plus className="h-5 w-5" /> Generate New Code
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Redeem Code</label>
                    <div className="flex gap-2">
                      <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="bg-black/20 border-white/10 font-mono" />
                      <Button size="icon" variant="secondary" onClick={() => setNewCode(generateCode())}><RefreshCw className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Plan Type</label>
                      <select value={newPlan} onChange={(e) => {setNewPlan(e.target.value); setNewValue(e.target.value === "Pro" ? "3" : "7")}} className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm outline-none focus:border-primary">
                        <option value="Pro">Pro ($3)</option>
                        <option value="Premium">Premium ($7)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Limit</label>
                      <Input type="number" value={newUsageLimit} onChange={(e) => setNewUsageLimit(e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                  </div>
                  <Button onClick={createCode} className="w-full shadow-lg shadow-primary/20">Create & Deploy</Button>
                </div>
              </div>
            </div>

            {/* Codes List */}
            <div className="lg:col-span-2 space-y-3">
              {codesLoading ? <OrbitalLoader /> : codes.map(c => (
                <div key={c.id} className={`bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all ${c.disabled ? 'opacity-50' : 'hover:bg-white/10'}`}>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono font-bold text-primary">{c.code}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/5 font-bold uppercase ${c.plan === 'Premium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {c.plan}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-[11px] text-slate-500">
                      <span>Used: <b>{c.usedCount}/{c.usageLimit}</b></span>
                      <span>Value: <b>${c.value}</b></span>
                      {c.expiry && <span>Expiry: {new Date(c.expiry).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => toggleCode(c.id, c.disabled)} className="hover:text-primary">
                      {c.disabled ? <ToggleLeft /> : <ToggleRight className="text-primary" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCode(c.id)} className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ANNOUNCE */}
        {tab === "announce" && (
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto text-primary mb-2 opacity-50" />
              <h2 className="text-2xl font-bold">Global Dashboard Alert</h2>
              <p className="text-slate-500 text-sm">This message will appear on every user's dashboard.</p>
            </div>
            <div className="space-y-4">
              <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Alert Message (e.g. 50% Off on Premium!)" className="bg-black/20 border-white/10 p-6 text-lg" />
              <Input value={announcementUrl} onChange={(e) => setAnnouncementUrl(e.target.value)} placeholder="Link URL (Optional)" className="bg-black/20 border-white/10" />
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="font-bold">Active Status</p>
                  <p className="text-xs text-slate-500">Toggle visibility for all users</p>
                </div>
                <button onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                  className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${announcementEnabled ? "bg-primary" : "bg-slate-700"}`}>
                  <div className={`h-5 w-5 rounded-full bg-white transition-transform ${announcementEnabled ? "translate-x-7" : "translate-x-0"}`} />
                </button>
              </div>
              <Button onClick={saveAnnouncement} className="w-full h-12 text-lg">Update Announcement</Button>
            </div>
          </div>
        )}

        {/* TAB: REFERRALS */}
        {tab === "referrals" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                <tr>
                  <th className="p-4">Inviter ID</th>
                  <th className="p-4">Referred User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {referrals.map(r => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-4 font-mono text-xs">{r.inviterId?.slice(0,10)}...</td>
                    <td className="p-4 font-mono text-xs">{r.referredUserId?.slice(0,10)}...</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{r.createdAt?.toDate?.().toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: LOGS */}
        {tab === "logs" && (
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${l.suspicious ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Code <span className="text-primary">{l.code}</span> redeemed</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">User: {l.userId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{l.timestamp?.toDate?.().toLocaleString()}</p>
                  {l.suspicious && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 rounded tracking-widest">SUSPICIOUS</span>}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminPanel;
      
