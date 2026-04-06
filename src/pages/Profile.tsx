import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import OrbitalLoader from "@/components/OrbitalLoader";

const Profile = () => {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading || !userData) return <OrbitalLoader fullScreen />;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="flex items-center gap-3 mb-8">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Profile</h1>
      </div>
      <div className="flex flex-col items-center">
        <img src={userData.photoURL || "/placeholder.svg"} alt="" className="h-20 w-20 rounded-full border-2 border-primary mb-4" />
        <h2 className="text-lg font-bold">{userData.displayName}</h2>
        <p className="text-sm text-muted-foreground">{userData.email}</p>
        <p className="text-xs text-muted-foreground mt-2">Joined {userData.createdAt.toLocaleDateString()}</p>
      </div>
      <div className="mt-8 space-y-3 max-w-sm mx-auto">
        <div className="bg-card border border-border rounded-xl p-4 flex justify-between">
          <span className="text-sm text-muted-foreground">Plan</span>
          <span className="font-semibold text-primary">{userData.planName}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex justify-between">
          <span className="text-sm text-muted-foreground">Credits</span>
          <span className="font-semibold">{userData.credits}</span>
        </div>
        <Button variant="destructive" className="w-full mt-6" onClick={() => { logout(); navigate("/"); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
