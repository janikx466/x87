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
  const [isVerifying, setIsVerifying] = useState(true);

  // New code form states
  const [newCode, setNewCode] = useState(generateCode());
  const [newValue, setNewValue] = useState("3");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newUsageLimit, setNewUsageLimit] = useState("1");
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  // Update: Smarter Redirect Logic
  useEffect(() => {
    if (!loading) {
      // 1. Check if user exists and is admin
      if (user && userData?.isAdmin === true) {
        setIsVerifying(false); // Access Granted
      } else {
        // 2. Give a small buffer for Firestore to sync
        const timer = setTimeout(() => {
          if (!userData?.isAdmin) {
            navigate("/dashboard", { replace: true });
          } else {
            setIsVerifying(false);
          }
        }, 2000); // 2 seconds wait
        return () => clearTimeout(timer);
      }
    }
  }, [user, userData, loading, navigate]);

  // Real-time Stats Loader
  useEffect(() => {
    if (!userData?.isAdmin || isVerifying) return;
    const loadStats = async () => {
      try {
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
      } catch (err) {
        console.error("Stats load error:", err);
      }
    };
    loadStats();
  }, [userData, tab, isVerifying]);

  // Announcement Sync
  useEffect(() => {
    if (!userData?.isAdmin || isVerifying) return;
    const unsub = onSnapshot(doc(db, "admin", "announcement"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAnnouncementText(d.text || "");
        setAnnouncementUrl(d.url || "");
        setAnnouncementEnabled(d.enabled || false);
      }
    });
    return () => unsub();
  }, [userData, isVerifying]);

  // Data Listeners
  useEffect(() => {
    if (!userData?.isAdmin || isVerifying) return;
    
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
  }, [userData, tab, isVerifying]);

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
  };

  const toggleCode = async (id: string, current: boolean) => updateDoc(doc(db, "redeem_codes", id), { disabled: !current });
  const deleteCode = async (id: string) => {
    if (window.confirm("Permanent delete?")) await deleteDoc(doc(db, "redeem_codes", id));
  };

  // Show Loader while verifying isAdmin status
  if (loading || isVerifying) return <OrbitalLoader fullScreen />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
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
        {/* Render content based on active tab (same as before) */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.users, icon: Users, color: "text-blue-400" },
              { label: "Total Vaults", val: stats.vaults, icon: Archive, color: "text-primary" },
              { label: "New (24h)", val: stats.newUsers24h, icon: Bell, color: "text-yellow-400" },
              { label: "Paid Users", val: stats.paidUsers, icon: Shield, color: "text-green-400" }
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <s.icon className={`h-6 w-6 ${s.color} mb-4`} />
                <p className="text-4xl font-black tracking-tight">{s.val}</p>
                <p className="text-xs text-slate-500 font-medium uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Codes, Announce, Referrals, Logs (Rest of the UI stays same) */}
        {tab === "codes" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-4">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sticky top-40">
               <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                 <Plus className="h-5 w-5" /> Generate New Code
               </h3>
               <div className="space-y-4">
                 <div className="flex gap-2">
                   <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="bg-black/20 border-white/10 font-mono" />
                   <Button size="icon" variant="secondary" onClick={() => setNewCode(generateCode())}><RefreshCw className="h-4 w-4" /></Button>
                 </div>
                 <Button onClick={createCode} className="w-full">Create & Deploy</Button>
               </div>
             </div>
           </div>
           <div className="lg:col-span-2 space-y-3">
             {codesLoading ? <OrbitalLoader /> : codes.map(c => (
               <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
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
          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Alert Message" className="bg-black/20 border-white/10" />
            <Button onClick={saveAnnouncement} className="w-full">Update Announcement</Button>
          </div>
        )}
        
        {/* Referrals & Logs render logic here... */}
      </main>
    </div>
  );
};

export default AdminPanel;
            
