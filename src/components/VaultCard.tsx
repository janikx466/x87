import { Link } from "react-router-dom";
import { Lock, Eye, Globe, Image } from "lucide-react";

interface Vault {
  id: string;
  name: string;
  imageCount: number;
  viewCount: number;
  maxViews: number;
  visibility: string;
  createdAt: Date;
  expired: boolean;
}

const VaultCard = ({ vault }: { vault: Vault }) => {
  const selfDestructed = vault.viewCount >= vault.maxViews;

  return (
    <Link to={`/vault/${vault.id}`} className="block">
      <div className={`border rounded-xl p-4 transition-all hover:border-primary/50 ${selfDestructed ? "opacity-50 border-destructive" : "border-border bg-card"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Image className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{vault.name}</p>
              <p className="text-xs text-muted-foreground">{vault.imageCount} images</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {vault.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {vault.visibility}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Eye className="h-3 w-3" /> {vault.viewCount}/{vault.maxViews}
            </div>
          </div>
        </div>
        {selfDestructed && <p className="text-xs text-destructive font-semibold mt-2">🔥 Self Destruct Completed</p>}
        {vault.expired && <p className="text-xs text-gold font-semibold mt-2">⏳ Expired</p>}
      </div>
    </Link>
  );
};

export default VaultCard;
