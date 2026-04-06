import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Terms & Conditions</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-4 text-sm text-muted-foreground">
        <p><strong className="text-foreground">Effective Date:</strong> January 2025</p>
        <h2 className="text-foreground text-lg font-semibold">1. Acceptance</h2>
        <p>By using SecretGPV, you agree to these terms. If you disagree, do not use the service.</p>
        <h2 className="text-foreground text-lg font-semibold">2. Usage Rules</h2>
        <p>You must not upload illegal, harmful, or copyrighted content. You must not attempt to bypass security measures, exploit vulnerabilities, or abuse the referral system.</p>
        <h2 className="text-foreground text-lg font-semibold">3. Credits & Plans</h2>
        <p>Credits are non-refundable. Plans auto-expire after 30 days. 1 image upload = 1 credit. Credits reset on plan renewal.</p>
        <h2 className="text-foreground text-lg font-semibold">4. Self-Destruct</h2>
        <p>Vaults with self-destruct enabled will become inaccessible after reaching the view limit. This is irreversible.</p>
        <h2 className="text-foreground text-lg font-semibold">5. Termination</h2>
        <p>We reserve the right to terminate accounts that violate these terms without notice.</p>
        <h2 className="text-foreground text-lg font-semibold">6. Contact</h2>
        <p>Questions? Email <a href="mailto:secretgpv@gmail.com" className="text-primary">secretgpv@gmail.com</a></p>
      </div>
    </div>
  );
};

export default Terms;
