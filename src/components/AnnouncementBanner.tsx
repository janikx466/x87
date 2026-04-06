import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<{ text: string; url: string; enabled: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "admin", "announcement"), (snap) => {
      if (snap.exists()) setAnnouncement(snap.data() as any);
    });
    return () => unsub();
  }, []);

  if (!announcement?.enabled || dismissed) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
      <p className="text-sm text-foreground flex-1">{announcement.text}</p>
      <div className="flex items-center gap-2">
        {announcement.url && (
          <a href={announcement.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" /> Visit</Button>
          </a>
        )}
        <button onClick={() => setDismissed(true)}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
