import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, generateInviteCode } from "@/contexts/AuthContext";
import { db, WORKER_BASE } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import ConsentModal from "@/components/ConsentModal";
import logo from "@/assets/logo.png";

const Auth = () => {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showConsent, setShowConsent] = useState(false);
  const [inviteCode, setInviteCode] = useState(searchParams.get("ref") || "");
  const [authLoading, setAuthLoading] = useState(false);
  const [visitorId, setVisitorId] = useState("");

  useEffect(() => {
    FingerprintJS.load().then((fp) => fp.get()).then((r) => setVisitorId(r.visitorId));
  }, []);

  useEffect(() => {
    if (user && !loading) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleGetStarted = () => setShowConsent(true);

  const handleConsent = async () => {
    setShowConsent(false);
    setAuthLoading(true);
    try {
      await loginWithGoogle();
      const u = (await import("firebase/auth")).getAuth().currentUser;
      if (!u) return;

      // Check if new user
      const userDoc = await getDoc(doc(db, "users", u.uid));
      if (!userDoc.exists()) {
        // Register via worker
        const token = await u.getIdToken();
        try {
          await fetch(`${WORKER_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              email: u.email,
              deviceId: visitorId,
              inviteCode: inviteCode || null,
              metadata: { ua: navigator.userAgent, screen: `${screen.width}x${screen.height}` },
            }),
          });
        } catch {
          // Fallback: create user doc directly with 5 credits + unique invite code
          const code = generateInviteCode(u.uid);
          await setDoc(doc(db, "users", u.uid), {
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            credits: 5,
            planName: "Free Trial",
            planExpiry: null,
            totalVaults: 0,
            inviteCode: code,
            termsAccepted: true,
            termsAcceptedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            isAdmin: false,
          });
        }
      }
      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error("Auth error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <OrbitalLoader fullScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      {authLoading && <OrbitalLoader fullScreen text="Authenticating..." />}
      <div className="w-full max-w-md text-center animate-float-up">
        <img src={logo} alt="SecretGPV" className="h-16 w-16 mx-auto mb-4 drop-shadow-[0_0_20px_hsl(142_71%_45%/0.4)]" />
        <h1 className="text-3xl font-bold mb-2">Welcome to Secret<span className="text-primary">GPV</span></h1>
        <p className="text-muted-foreground mb-8">Sign in to access your private vaults</p>
        <div className="space-y-4">
          <Input
            placeholder="Invite Code (optional)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="text-center"
          />
          <Button onClick={handleGetStarted} size="lg" className="w-full text-lg py-6 animate-blink-glow">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </Button>
        </div>
      </div>
      {showConsent && <ConsentModal onAgree={handleConsent} onCancel={() => setShowConsent(false)} />}
    </div>
  );
};

export default Auth;
