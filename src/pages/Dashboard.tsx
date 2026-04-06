import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { CreditCard, Plus, User, MoreVertical, Copy, Share2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import RedeemModal from "@/components/RedeemModal";
import VaultCard from "@/components/VaultCard";
import ReferralSection from "@/components/ReferralSection";
import logo from "@/assets/logo.png";

interface Vault {
  id: string;
  name: string;
  imageCount: number;
  viewCount: number;
  maxViews: number;
  visibility: string;
  createdAt: Date;
  expired: boolean;
}

const Dashboard = () => {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [vaultsLoading, setVaultsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "vaults"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const v = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "Untitled Vault",
          imageCount: data.imageCount || 0,
          viewCount: data.viewCount || 0,
          maxViews: data.maxViews || 500,
          visibility: data.visibility || "private",
          createdAt: data.createdAt?.toDate?.() || new Date(),
          expired: data.expired || false,
        };
      });
      setVaults(v);
      setVaultsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const inviteLink = `${window.location.origin}/auth?ref=${userData?.inviteCode || ""}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Join SecretGPV", text: "Share photos privately!", url: inviteLink });
    } else handleCopy();
  };

  if (loading) return <OrbitalLoader fullScreen />;
  if (!userData) return <OrbitalLoader fullScreen />;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7 w-7" />
            <span className="font-bold text-lg">Secret<span className="text-primary">GPV</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowRedeem(true)} className="text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-1" /> Upgrade
            </Button>
            <Link to="/profile">
              <Button size="icon" variant="ghost"><User className="h-5 w-5" /></Button>
            </Link>
            <div className="relative">
              <Button size="icon" variant="ghost" onClick={() => setShowMenu(!showMenu)}>
                <MoreVertical className="h-5 w-5" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-xl py-2 w-48 z-50">
                  <Link to="/privacy" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowMenu(false)}>Privacy Policy</Link>
                  <Link to="/terms" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowMenu(false)}>Terms & Conditions</Link>
                  <Link to="/about" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowMenu(false)}>About Us</Link>
                  <Link to="/contact" className="block px-4 py-2 text-sm hover:bg-accent" onClick={() => setShowMenu(false)}>Contact</Link>
                  <button onClick={() => { logout(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AnnouncementBanner />

      <div className="px-4 pt-4 space-y-6">
        {/* Plan & Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-bold text-primary">{userData.planName}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="font-bold text-primary">{userData.credits}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total Vaults</p>
            <p className="font-bold">{vaults.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Expiry</p>
            <p className="font-bold text-sm">{userData.planExpiry ? userData.planExpiry.toLocaleDateString() : "N/A"}</p>
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Gift className="h-4 w-4 text-primary" /> Invite & Earn</p>
          <p className="text-xs text-muted-foreground mb-3">Share your invite link. Each paid signup = +5 credits!</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-xs truncate">{inviteLink}</div>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          {copied && <p className="text-xs text-primary mt-1">Copied!</p>}
        </div>

        {/* Referral & Rewards */}
        <ReferralSection />

        {/* Vaults */}
        <div>
          <h2 className="text-lg font-bold mb-3">Your Vaults</h2>
          {vaultsLoading ? (
            <OrbitalLoader size="sm" />
          ) : vaults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No vaults yet. Create your first vault!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaults.map((v) => <VaultCard key={v.id} vault={v} />)}
            </div>
          )}
        </div>
      </div>

      {/* Floating Create Button */}
      <Link to="/create-vault" className="fixed bottom-6 right-6 z-40">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg shadow-primary/30">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>

      {showRedeem && <RedeemModal onClose={() => setShowRedeem(false)} />}
    </div>
  );
};

export default Dashboard;
