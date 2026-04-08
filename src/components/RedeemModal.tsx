import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { auth, WORKER_BASE } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { X, Check, AlertCircle } from "lucide-react";

const plans = [
  { name: "Pro", price: "$3", credits: 500, features: ["500 Credits", "500 Max Views", "Custom Expiry", "QR Codes"] },
  { name: "Premium", price: "$7", credits: 1200, features: ["1200 Credits", "Unlimited Views", "Custom Expiry", "Priority Support"] },
];

const RedeemModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim() || !selectedPlan) return;
    setStatus("loading");
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`${WORKER_BASE}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim().toUpperCase(), uid: user?.uid }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setStatus("success");
        setTimeout(onClose, 2000);
      } else {
        setErrorMsg(data.message || "Invalid code");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Try again.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 animate-float-up relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="h-5 w-5 text-muted-foreground" /></button>

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Plan Activated!</h3>
            <p className="text-sm text-muted-foreground mt-2">Your {selectedPlan} plan is now active.</p>
          </div>
        ) : status === "loading" ? (
          <OrbitalLoader size="sm" text="Processing..." />
        ) : showConfirm ? (
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">Confirm Activation</h3>
            <p className="text-sm text-muted-foreground mb-6">Activate {selectedPlan} plan with code: <span className="font-mono text-primary">{code}</span>?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowConfirm(false); }} className="flex-1">Cancel</Button>
              <Button onClick={handleConfirm} className="flex-1">Confirm</Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-4">Activate Plan</h3>
            {!selectedPlan ? (
              <div className="space-y-3">
                {plans.map((p) => (
                  <button key={p.name} onClick={() => setSelectedPlan(p.name)} className="w-full text-left border border-border rounded-xl p-4 hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-primary font-bold">{p.price}</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {p.features.map((f) => <li key={f}>• {f}</li>)}
                    </ul>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">Plan: <span className="font-bold text-primary">{selectedPlan}</span></p>
                <Input placeholder="Enter Redeem Code" value={code} onChange={(e) => { setCode(e.target.value); setStatus("idle"); setErrorMsg(""); }} className="font-mono text-center tracking-widest" />
                {status === "error" && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errorMsg}</p>
                )}
                <Button onClick={handleValidate} disabled={!code.trim()} className="w-full">Activate Now</Button>
                <button onClick={() => setSelectedPlan(null)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">← Choose different plan</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RedeemModal;
