import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { ArrowLeft, Lock, AlertCircle } from "lucide-react";
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
    // Initial fetch to check vault status (expiry, self-destruct)
    getDoc(doc(db, "vaults", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setVaultData(d);
        // Strict check for expiration and self-destruct
        if (d.viewCount >= d.maxViews || d.selfDestructed || d.expired) {
          setDestructed(true);
        }
      }
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [id]);

  const handleUnlock = async () => {
    if (!pin || pin.length < 4) return;
    setLoading(true);
    setError(false);

    try {
      // Fixed Endpoint: worker version 3.0 uses /verify-vault
      const res = await fetch(`${WORKER_BASE}/verify-vault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultId: id, pin }),
      });

      const data = await res.json();

      if (data.status === "success" && data.images) {
        setImages(data.images); // These are the R2 URLs from Worker
        setSessionToken(data.sessionToken || "verified");
        
        // Update view count in Firestore
        if (id) {
          await updateDoc(doc(db, "vaults", id), { 
            viewCount: increment(1) 
          });
        }
        setStep("gallery");
      } else {
        // Handle Wrong PIN or Worker Error
        setError(true);
        setPin("");
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setError(true);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <OrbitalLoader fullScreen />;

  if (destructed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4 bg-[#1a1e23]">
        <div className="animate-float-up">
          <p className="text-6xl mb-6">💣</p>
          <h2 className="text-2xl font-bold text-destructive mb-2">Self Destruct Completed</h2>
          <p className="text-muted-foreground">This vault's contents have been permanently erased.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="mt-8">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  if (step === "gallery" && sessionToken && images.length > 0) {
    return (
      <Gallery 
        images={images} 
        downloadable={vaultData?.downloadable} 
        vaultName={vaultData?.name} 
        onBack={() => navigate("/")} 
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#1a1e23]">
      {loading && <OrbitalLoader fullScreen text="Opening Vault..." />}
      
      <div className="w-full max-w-sm text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
          <Lock className="h-10 w-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-white">Private Vault</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Enter the 4-6 digit PIN to decrypt this vault.
        </p>

        <div className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { 
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); 
              setError(false); 
            }}
            placeholder="••••"
            className={`h-14 text-center text-3xl tracking-[0.6em] bg-white/5 border-white/10 focus:border-primary transition-all duration-300 ${
              error ? "animate-snake-shake border-destructive text-destructive" : "text-white"
            }`}
          />

          {error && (
            <div className="flex items-center justify-center gap-2 text-destructive animate-pulse">
              <AlertCircle size={14} />
              <p className="text-xs font-medium">Authentication failed. Check your PIN.</p>
            </div>
          )}

          <Button 
            onClick={handleUnlock} 
            disabled={pin.length < 4 || loading} 
            className="w-full h-12 text-lg font-semibold mt-4 transition-all active:scale-95"
            size="lg"
          >
            Access Photos
          </Button>
        </div>
        
        {vaultData?.reminder && (
          <p className="mt-8 text-xs text-muted-foreground italic">
            Hint: {vaultData.reminder}
          </p>
        )}
      </div>
    </div>
  );
};

export default VaultViewer;
