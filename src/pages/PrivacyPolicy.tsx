import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-4 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Effective Date:</strong> January 2025</p>
        <h2 className="text-foreground text-lg font-semibold">1. Information We Collect</h2>
        <p>We collect your Google account information (name, email, profile photo) when you sign in. We also collect device fingerprints for fraud prevention and security purposes.</p>
        <h2 className="text-foreground text-lg font-semibold">2. How We Use Your Information</h2>
        <p>Your information is used to provide the service, prevent fraud, manage your account, and process redeem codes. We never sell your data to third parties.</p>
        <h2 className="text-foreground text-lg font-semibold">3. Data Storage</h2>
        <p>Your photos are stored on Cloudflare R2 with encryption. Metadata is stored on Firebase Firestore with strict security rules. Only vault owners can access their data.</p>
        <h2 className="text-foreground text-lg font-semibold">4. Data Deletion</h2>
        <p>You can request complete data deletion by contacting secretgpv@gmail.com. Expired vaults are hidden but data is retained for the account owner.</p>
        <h2 className="text-foreground text-lg font-semibold">5. Contact</h2>
        <p>For privacy concerns, contact us at <a href="mailto:secretgpv@gmail.com" className="text-primary">secretgpv@gmail.com</a></p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
