import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, User, Crown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Referral {
  id: string;
  referredUserId: string;
  status: "free" | "paid";
  createdAt: Date;
}

const ReferralSection = () => {
  const { user, userData } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showGift, setShowGift] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "referrals"), where("inviterId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const refs = snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, referredUserId: data.referredUserId, status: data.status, createdAt: data.createdAt?.toDate?.() || new Date() };
      });
      // Sort: paid first, then free
      refs.sort((a, b) => {
        if (a.status === "paid" && b.status !== "paid") return -1;
        if (a.status !== "paid" && b.status === "paid") return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      setReferrals(refs);
    });
    return () => unsub();
  }, [user]);

  const paidCount = referrals.filter((r) => r.status === "paid").length;
  const progress = Math.min(paidCount / 5, 1);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-gold" /> Referral Rewards</p>
        <span className="text-xs text-muted-foreground">{referrals.length} total</span>
      </div>

      {/* Gift Box */}
      <button onClick={() => setShowGift(!showGift)} className="w-full bg-gradient-to-r from-primary/10 to-blue-accent/10 border border-primary/20 rounded-lg p-4 mb-3 text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Get Free Pro Plan</p>
            <p className="text-xs text-muted-foreground">Invite 5 paid users to unlock</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 bg-secondary rounded-full h-2 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{paidCount}/5 paid referrals</p>
      </button>

      {showGift && (
        <div className="bg-secondary/50 rounded-lg p-3 mb-3 text-xs text-muted-foreground space-y-2">
          <p>📋 <strong>How it works:</strong></p>
          <p>1. Share your invite link with friends</p>
          <p>2. When they sign up and activate a paid plan, you get +1 progress</p>
          <p>3. Reach 5 paid referrals to unlock a free 30-day Pro plan!</p>
          {paidCount >= 5 && (
            <Button size="sm" className="w-full mt-2" disabled={userData?.planName !== "Free Trial" && userData?.planName !== "Expired"}>
              {userData?.planName !== "Free Trial" && userData?.planName !== "Expired" ? "Active plan exists — available after expiry" : "Activate Free Pro Plan"}
            </Button>
          )}
        </div>
      )}

      {/* Referral List */}
      {referrals.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {referrals.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{r.referredUserId.slice(0, 8)}...</span>
              </div>
              <span className={`flex items-center gap-1 ${r.status === "paid" ? "text-primary" : "text-muted-foreground"}`}>
                {r.status === "paid" && <CheckCircle className="h-3 w-3" />}
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
