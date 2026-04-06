import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { ArrowLeft, Upload, X, RotateCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db, WORKER_BASE } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";

type UploadStatus = "pending" | "compressing" | "uploading" | "success" | "error";
interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  fileName?: string;
}

const CreateVault = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [reminder, setReminder] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public" | "custom">("private");
  const [customEmail, setCustomEmail] = useState("");
  const [downloadable, setDownloadable] = useState(false);
  const [expiryValue, setExpiryValue] = useState("24");
  const [expiryUnit, setExpiryUnit] = useState<"m" | "h" | "d">("h");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [creating, setCreating] = useState(false);

  const creditsLeft = (userData?.credits || 0) - files.length;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      status: "pending" as UploadStatus,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadFile = async (item: FileItem, token: string): Promise<string | null> => {
    try {
      // Compress
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: "compressing" } : f));
      const compressed = await imageCompression(item.file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 0.8,
        useWebWorker: true,
      });
      const ext = item.file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;

      // Upload
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: "uploading", fileName } : f));
      const res = await fetch(`${WORKER_BASE}/?file=${fileName}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": compressed.type },
        body: compressed,
      });
      if (!res.ok) throw new Error("Upload failed");
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: "success" } : f));
      return fileName;
    } catch {
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: "error" } : f));
      return null;
    }
  };

  const handleCreate = async () => {
    if (!user || !name.trim() || !pin || pin.length < 4 || files.length === 0 || creditsLeft < 0) return;
    setCreating(true);
    try {
      const token = await user.getIdToken();
      // Parallel batch upload (3 concurrent)
      const fileKeys: string[] = [];
      const BATCH = 3;
      for (let i = 0; i < files.length; i += BATCH) {
        const batch = files.slice(i, i + BATCH);
        const results = await Promise.all(batch.map((f) => uploadFile(f, token)));
        results.forEach((r) => { if (r) fileKeys.push(r); });
        if (i + BATCH < files.length) await new Promise((r) => setTimeout(r, 150));
      }

      if (fileKeys.length === 0) { setCreating(false); return; }

      // Calculate expiry
      const multipliers = { m: 60000, h: 3600000, d: 86400000 };
      const expiryAt = new Date(Date.now() + parseInt(expiryValue) * multipliers[expiryUnit]);

      // Create vault doc
      const maxViews = userData?.planName === "Premium" ? 999999 : 500;
      await addDoc(collection(db, "vaults"), {
        ownerId: user.uid,
        name: name.trim(),
        pin,
        reminder: reminder.trim(),
        visibility,
        customEmail: visibility === "custom" ? customEmail : null,
        downloadable,
        fileKeys,
        imageCount: fileKeys.length,
        viewCount: 0,
        maxViews,
        expiryAt,
        expired: false,
        selfDestructed: false,
        createdAt: serverTimestamp(),
      });

      // Deduct credits
      await updateDoc(doc(db, "users", user.uid), {
        credits: increment(-fileKeys.length),
        totalVaults: increment(1),
      });

      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error("Create vault error:", e);
    } finally {
      setCreating(false);
    }
  };

  if (creating) return <OrbitalLoader fullScreen text="Creating Vault..." />;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Create Vault</h1>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        <div>
          <label className="text-sm font-medium mb-1 block">Vault Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Secret Photos" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">PIN (4-6 digits)</label>
          <Input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••" maxLength={6} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Reminder Text (optional)</label>
          <Input value={reminder} onChange={(e) => setReminder(e.target.value)} placeholder="Hint for QR viewers" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Visibility</label>
          <div className="flex gap-2">
            {(["private", "public", "custom"] as const).map((v) => (
              <button key={v} onClick={() => setVisibility(v)}
                className={`px-4 py-2 rounded-lg text-sm capitalize border transition-all ${visibility === v ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                {v}
              </button>
            ))}
          </div>
          {visibility === "custom" && <Input className="mt-2" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="recipient@gmail.com" />}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Expiry</label>
          <div className="flex gap-2">
            <Input type="number" value={expiryValue} onChange={(e) => setExpiryValue(e.target.value)} className="w-24" />
            <div className="flex gap-1">
              {(["m", "h", "d"] as const).map((u) => (
                <button key={u} onClick={() => setExpiryUnit(u)}
                  className={`px-3 py-2 rounded-lg text-sm border ${expiryUnit === u ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                  {u === "m" ? "Min" : u === "h" ? "Hr" : "Day"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Allow Download</label>
          <button onClick={() => setDownloadable(!downloadable)}
            className={`w-12 h-6 rounded-full transition-all ${downloadable ? "bg-primary" : "bg-secondary"}`}>
            <div className={`h-5 w-5 rounded-full bg-foreground transition-transform ${downloadable ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Images</label>
            <span className={`text-xs ${creditsLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {creditsLeft < 0 ? "Not enough credits!" : `${creditsLeft} credits remaining`}
            </span>
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          <button onClick={() => fileInput.current?.click()} disabled={creditsLeft <= 0}
            className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-all disabled:opacity-50">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to select images</p>
          </button>
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {files.map((f) => (
                <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={f.preview} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    {f.status === "pending" && <span className="text-[10px] text-muted-foreground">Ready</span>}
                    {f.status === "compressing" && <span className="text-[10px] text-blue-accent">Compressing</span>}
                    {f.status === "uploading" && <span className="text-[10px] text-gold">Uploading</span>}
                    {f.status === "success" && <Check className="h-5 w-5 text-primary" />}
                    {f.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                  </div>
                  {f.status !== "uploading" && f.status !== "compressing" && (
                    <button onClick={() => removeFile(f.id)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleCreate} disabled={!name.trim() || !pin || pin.length < 4 || files.length === 0 || creditsLeft < 0} className="w-full mt-4" size="lg">
          Create Vault ({files.length} images)
        </Button>
      </div>
    </div>
  );
};

export default CreateVault;
