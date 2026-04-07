import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import QRCodeStyling from "qr-code-styling";
import confetti from "canvas-confetti";
import { ArrowLeft, QrCode, Share2, Eye, Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import OrbitalLoader from "@/components/OrbitalLoader";
import logo from "@/assets/logo.png";

const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "vaults", id)).then((snap) => {
      if (snap.exists()) setVault({ id: snap.id, ...snap.data() });
      setLoading(false);
    }).catch((err) => {
      console.error("Vault fetch error:", err);
      toast.error("Failed to load vault");
      setLoading(false);
    });
  }, [id]);

  const generateQR = () => {
    setShowQR(true);
    setQrReady(false);
    setTimeout(() => {
      if (!qrRef.current) return;
      qrRef.current.innerHTML = "";
      const qr = new QRCodeStyling({
        width: 280,
        height: 280,
        type: "canvas",
        data: `${window.location.origin}/v/${id}`,
        image: logo,
        dotsOptions: {
          type: "dots",
          gradient: { type: "radial", colorStops: [{ offset: 0, color: "#2563eb" }, { offset: 0.5, color: "#9333ea" }, { offset: 1, color: "#22c55e" }] },
        },
        cornersSquareOptions: { type: "extra-rounded", color: "#16a34a" },
        cornersDotOptions: { type: "dot", color: "#16a34a" },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.3 },
      });
      qrInstanceRef.current = qr;
      qr.append(qrRef.current);
      setQrReady(true);
      // Confetti
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 }, colors: ["#ffffff", "#22c55e", "#ffd700"] });
        const end = Date.now() + 800;
        (function frame() {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.5 }, colors: ["#22c55e", "#2563eb", "#9333ea"] });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.5 }, colors: ["#22c55e", "#2563eb", "#9333ea"] });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
      }, 300);
    }, 100);
  };

  const downloadQR = async () => {
    if (!qrInstanceRef.current) return;
    setDownloading(true);
    try {
      // Use qr-code-styling's native download — avoids html2canvas issues entirely
      await qrInstanceRef.current.download({
        name: "SecretGPV-Vault-QR",
        extension: "png",
      });
      toast.success("QR downloaded!");
    } catch (err) {
      console.error("QR download error:", err);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/v/${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`🔒 Open my private vault: ${url}`)}`, "_blank");
  };

  if (loading) return <OrbitalLoader fullScreen />;
  if (!vault) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Vault not found</div>;

  const selfDestructed = vault.viewCount >= vault.maxViews;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold flex-1 truncate">{vault.name}</h1>
      </div>

      {selfDestructed ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">💣</p>
          <h2 className="text-xl font-bold text-destructive">Self Destruct Completed</h2>
          <p className="text-sm text-muted-foreground mt-2">This vault has reached its view limit.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold text-sm">{vault.viewCount}/{vault.maxViews}</p>
              <p className="text-[10px] text-muted-foreground">Views</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Lock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold text-sm capitalize">{vault.visibility}</p>
              <p className="text-[10px] text-muted-foreground">Visibility</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Download className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold text-sm">{vault.downloadable ? "ON" : "OFF"}</p>
              <p className="text-[10px] text-muted-foreground">Download</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{vault.imageCount} images • Created {vault.createdAt?.toDate?.().toLocaleDateString()}</p>

          <Button onClick={generateQR} className="w-full" size="lg" disabled={showQR}>
            <QrCode className="h-5 w-5 mr-2" /> Generate QR Code
          </Button>

          {showQR && (
            <div className="animate-float-up">
              <div className="bg-card/50 backdrop-blur-lg border border-border rounded-2xl p-6 text-center">
                <div ref={qrRef} className="bg-foreground p-3 rounded-xl inline-block shadow-lg mb-4" />
                {vault.reminder && <p className="text-sm text-muted-foreground italic mb-3">"{vault.reminder}"</p>}
                <div className="flex items-center justify-center gap-1 text-[10px] tracking-widest uppercase">
                  <span className="text-muted-foreground">Powered by</span>
                  <span className="text-primary font-bold">SecretGPV Vault</span>
                </div>
              </div>
              {qrReady && (
                <div className="flex gap-3 mt-4">
                  <Button onClick={downloadQR} variant="outline" className="flex-1" disabled={downloading}>
                    <Download className="h-4 w-4 mr-1" /> {downloading ? "Saving..." : "Download"}
                  </Button>
                  <Button onClick={shareWhatsApp} className="flex-1 bg-[hsl(142_71%_35%)]"><Share2 className="h-4 w-4 mr-1" /> WhatsApp</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VaultDetail;
