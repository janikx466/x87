import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props { onAgree: () => void; onCancel: () => void; }

const ConsentModal = ({ onAgree, onCancel }: Props) => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 max-h-[80vh] overflow-y-auto animate-float-up">
        <h2 className="text-xl font-bold mb-4">Before you continue</h2>
        <p className="text-sm text-muted-foreground mb-4">Please review and accept our policies to proceed.</p>

        {/* Privacy Policy */}
        <div className="border border-border rounded-lg mb-3">
          <button onClick={() => setShowPrivacy(!showPrivacy)} className="w-full flex items-center justify-between p-4 text-left">
            <span className="font-medium">Privacy Policy</span>
            {showPrivacy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showPrivacy && (
            <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
              <p>SecretGPV collects minimal data required for service operation. Your photos are encrypted and stored securely on Cloudflare R2. We never sell or share your personal data with third parties.</p>
              <p>We use device fingerprinting solely for fraud prevention. You can request data deletion at any time by contacting secretgpv@gmail.com.</p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="border border-border rounded-lg mb-6">
          <button onClick={() => setShowTerms(!showTerms)} className="w-full flex items-center justify-between p-4 text-left">
            <span className="font-medium">Terms & Conditions</span>
            {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showTerms && (
            <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
              <p>By using SecretGPV, you agree to use the platform lawfully. You must not upload illegal, harmful, or copyrighted content without authorization.</p>
              <p>Credits are non-refundable. Plans auto-expire after 30 days. We reserve the right to terminate accounts violating these terms.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={onAgree} className="flex-1">I Agree</Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
