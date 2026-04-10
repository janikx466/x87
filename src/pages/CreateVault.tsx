import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { ArrowLeft, Upload, X, Check, AlertCircle } from "lucide-react";
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
  const [files, setFiles] = useState<FileItem[]>([]);
  const [creating, setCreating] = useState(false);

  const creditsLeft = (userData?.credits || 0) - files.length;

  // 📁 Handle Files
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

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 📤 Upload Function
  const uploadFile = async (item: FileItem, token: string): Promise<string | null> => {
    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "compressing" } : f))
      );

      const compressed = await imageCompression(item.file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 0.8,
        useWebWorker: true,
      });

      const ext = item.file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "uploading", fileName } : f
        )
      );

      const res = await fetch(`${WORKER_BASE}/?file=${fileName}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": compressed.type,
        },
        body: compressed,
      });

      if (!res.ok) throw new Error("Upload failed");

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "success" } : f))
      );

      return fileName;
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "error" } : f))
      );
      return null;
    }
  };

  // 🚀 Create Vault
  const handleCreate = async () => {
    if (!user) return;

    if (!name.trim()) return alert("Enter vault name");
    if (!pin || pin.length < 4) return alert("Enter valid PIN");
    if (files.length === 0) return alert("Upload at least 1 image");
    if (creditsLeft < 0) return alert("Not enough credits");

    setCreating(true);

    try {
      const token = await user.getIdToken();

      // 📤 Upload files (batch)
      const fileKeys: string[] = [];
      const BATCH = 3;

      for (let i = 0; i < files.length; i += BATCH) {
        const batch = files.slice(i, i + BATCH);

        const results = await Promise.all(
          batch.map((f) => uploadFile(f, token))
        );

        results.forEach((r) => {
          if (r) fileKeys.push(r);
        });
      }

      if (fileKeys.length === 0) {
        alert("Upload failed");
        setCreating(false);
        return;
      }

      // 🧠 Create Vault (FIXED)
      const docRef = await addDoc(collection(db, "vaults"), {
        ownerId: user.uid,
        name: name.trim(),
        pin: pin.toString(),
        fileKeys,
        imageCount: fileKeys.length,
        createdAt: serverTimestamp(),
      });

      const vaultId = docRef.id;

      console.log("✅ Vault Created ID:", vaultId);

      // 💰 Deduct credits
      await updateDoc(doc(db, "users", user.uid), {
        credits: increment(-fileKeys.length),
      });

      // 🔥 Redirect with correct ID
      navigate(`/v/${vaultId}`);

    } catch (err) {
      console.error("Create vault error:", err);
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  if (creating) return <OrbitalLoader fullScreen text="Creating Vault..." />;

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Create Vault</h1>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">

        <Input
          placeholder="Vault Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          type="password"
          placeholder="PIN (4-6 digits)"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />

        {/* Upload */}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFiles}
          className="hidden"
        />

        <button
          onClick={() => fileInput.current?.click()}
          className="w-full border-2 border-dashed rounded-xl p-6"
        >
          <Upload className="mx-auto mb-2" />
          Select Images
        </button>

        {/* Preview */}
        <div className="grid grid-cols-4 gap-2">
          {files.map((f) => (
            <div key={f.id} className="relative">
              <img src={f.preview} className="rounded" />

              {f.status === "success" && (
                <Check className="absolute top-1 right-1 text-green-500" />
              )}

              {f.status === "error" && (
                <AlertCircle className="absolute top-1 right-1 text-red-500" />
              )}

              <button
                onClick={() => removeFile(f.id)}
                className="absolute top-1 left-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <Button onClick={handleCreate} className="w-full">
          Create Vault ({files.length})
        </Button>

      </div>
    </div>
  );
};

export default CreateVault;
