import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import QRCodeStyling from "qr-code-styling";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import { ArrowLeft, QrCode, Share2, Eye, Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import OrbitalLoader from "@/components/OrbitalLoader";
import logo from "@/assets/logo.png";

const BASE_URL = "https://x87.lovable.app"; // ✅ FIXED DOMAIN

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
  const qrExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    getDoc(doc(db, "vaults", id))
      .then((snap) => {
        if (snap.exists()) setVault({ id: snap.id, ...snap.data() });
        setLoading(false);
      })
      .catch((err) => {
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

        // ✅ FIXED URL HERE
        data: `${BASE_URL}/v/${id}`,

        image: logo,
        dotsOptions: {
          type: "dots",
          gradient: {
            type: "radial",
            colorStops: [
              { offset: 0, color: "#2563eb" },
              { offset: 0.5, color: "#9333ea" },
              { offset: 1, color: "#22c55e" },
            ],
          },
        },
        cornersSquareOptions: { type: "extra-rounded", color: "#16a34a" },
        cornersDotOptions: { type: "dot", color: "#16a34a" },
        backgroundOptions: { color: "#ffffff" },
        imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.3 },
      });

      qr.append(qrRef.current);
      setQrReady(true);

      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.4 },
          colors: ["#ffffff", "#22c55e", "#ffd700"],
        });

        const end = Date.now() + 800;

        (function frame() {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.5 },
            colors: ["#22c55e", "#2563eb", "#9333ea"],
          });

          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.5 },
            colors: ["#22c55e", "#2563eb", "#9333ea"],
          });

          if (Date.now() < end) requestAnimationFrame(frame);
        })();
      }, 300);
    }, 100);
  };

  const downloadQR = async () => {
    if (!qrExportRef.current) return;

    setDownloading(true);

    try {
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );

      const canvas = await html2canvas(qrExportRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = "SecretGPV-Vault-QR.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("QR downloaded!");
    } catch (err) {
      console.error("QR download error:", err);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const shareWhatsApp = () => {
    const url = `${BASE_URL}/v/${id}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `🔒 Open my private vault: ${url}`
      )}`,
      "_blank"
    );
  };

  if (loading) return <OrbitalLoader fullScreen />;

  if (!vault)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Vault not found
      </div>
    );

  const selfDestructed = vault.viewCount >= vault.maxViews;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-xl font-bold flex-1 truncate">{vault.name}</h1>
      </div>

      {selfDestructed ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">💣</p>
          <h2 className="text-xl font-bold text-destructive">
            Self Destruct Completed
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            This vault has reached its view limit.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold text-sm">
                {vault.viewCount}/{vault.maxViews}
              </p>
              <p className="text-[10px] text-muted-foreground">Views</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Lock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold text-sm capitalize">
                {vault.visibility}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Visibility
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Download className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold text-sm">
                {vault.downloadable ? "ON" : "OFF"}
              </p>
              <p className="text-[10px] text-muted-foreground">Download</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {vault.imageCount} images • Created{" "}
            {vault.createdAt?.toDate?.().toLocaleDateString()}
          </p>

          <Button
            onClick={generateQR}
            className="w-full"
            size="lg"
            disabled={showQR}
          >
            <QrCode className="h-5 w-5 mr-2" />
            Generate QR Code
          </Button>

          {showQR && (
            <div className="animate-float-up">
              <div
                ref={qrExportRef}
                style={{
                  background: "#ffffff",
                  padding: "24px",
                  borderRadius: "16px",
                  textAlign: "center",
                  display: "inline-block",
                  width: "100%",
                }}
              >
                <div
                  ref={qrRef}
                  style={{ display: "inline-block", marginBottom: "16px" }}
                />

                {vault.reminder && (
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      fontStyle: "italic",
                      marginBottom: "12px",
                      fontFamily: "system-ui",
                    }}
                  >
                    "{vault.reminder}"
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "4px",
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  <span style={{ color: "#9ca3af" }}>Powered by</span>
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>
                    SecretGPV Vault
                  </span>
                </div>
              </div>

              {qrReady && (
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={downloadQR}
                    variant="outline"
                    className="flex-1"
                    disabled={downloading}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {downloading ? "Saving..." : "Download"}
                  </Button>

                  <Button
                    onClick={shareWhatsApp}
                    className="flex-1 bg-[hsl(142_71%_35%)]"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
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
