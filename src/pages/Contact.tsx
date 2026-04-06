import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Contact Us</h1>
      </div>
      <div className="text-center py-12">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Get in Touch</h2>
        <p className="text-muted-foreground mb-6">Have questions, feedback, or need support?</p>
        <a href="mailto:secretgpv@gmail.com">
          <Button size="lg"><Mail className="h-4 w-4 mr-2" /> secretgpv@gmail.com</Button>
        </a>
      </div>
    </div>
  );
};

export default Contact;
