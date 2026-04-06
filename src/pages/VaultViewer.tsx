import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, WORKER_BASE } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import Gallery from "@/components/Gallery";

const VaultViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<"pin" | "gallery">("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [sessionToken, setSessionToken] = useState("");
  const [vaultData, setVaultData] = useState<any>(null);
  const [destructed, setDestructed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "vaults", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setVaultData(d);
        if (d.viewCount >= d.maxViews || d.selfDestructed) setDestructed(true);
        if (d.expired) setDestructed(true);
      }
      setChecking(false);
    });
  }, [id]);

  const handleUnlock = async () => {
    if (!pin || pin.length < 4) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${WORKER_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultId: id, pin }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setImages(data.images || []);
        setSessionToken(data.sessionToken || "verified");
        // Increment view count
        if (id) {
          await updateDoc(doc(db, "vaults", id), { viewCount: increment(1) });
        }
        setStep("gallery");
      } else {
        setError(true);
        setPin("");
      }
    } catch {
      // Fallback: try direct Firestore check
      if (vaultData && vaultData.pin === pin) {
        setSessionToken("local");
        setStep("gallery");
        if (id) await updateDoc(doc(db, "vaults", id), { viewCount: increment(1) });
      } else {
        setError(true);
        setPin("");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <OrbitalLoader fullScreen />;

  if (destructed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-5xl mb-4">💣</p>
          <h2 className="text-xl font-bold text-destructive">Self Destruct Completed</h2>
          <p className="text-sm text-muted-foreground mt-2">This vault is no longer accessible.</p>
        </div>
      </div>
    );
  }

  if (step === "gallery" && sessionToken) {
    return <Gallery images={images} downloadable={vaultData?.downloadable} vaultName={vaultData?.name} onBack={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {loading && <OrbitalLoader fullScreen text="Verifying..." />}
      <div className="w-full max-w-sm text-center animate-float-up">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Enter PIN</h2>
        <p className="text-sm text-muted-foreground mb-6">This vault is protected. Enter the PIN to view.</p>
        <Input
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(false); }}
          placeholder="••••"
          maxLength={6}
          className={`text-center text-2xl tracking-[0.5em] mb-4 ${error ? "animate-snake-shake border-destructive" : ""}`}
        />
        {error && <p className="text-xs text-destructive mb-3">Wrong PIN. Try again.</p>}
        <Button onClick={handleUnlock} disabled={pin.length < 4} className="w-full" size="lg">Unlock Vault</Button>
      </div>
    </div>
  );
};

export default VaultViewer;
