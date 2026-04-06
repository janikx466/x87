import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">About Us</h1>
      </div>
      <div className="text-center mb-8">
        <img src={logo} alt="SecretGPV" className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Secret<span className="text-primary">GPV</span></h2>
        <p className="text-muted-foreground mt-2">Ultra-fast, secure private photo sharing</p>
      </div>
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>SecretGPV is a premium SaaS platform designed for people who value privacy. We combine military-grade encryption with a beautiful, intuitive user experience.</p>
        <p>Our mission is simple: give you complete control over your private photos. Share on your terms, with PIN-protected vaults, self-destructing links, and zero compromise on security.</p>
        <p>Built with cutting-edge technology — React, Firebase, Cloudflare R2, and edge workers — for the fastest, most secure experience possible.</p>
      </div>
    </div>
  );
};

export default About;
