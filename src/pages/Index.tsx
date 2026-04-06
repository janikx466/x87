import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Zap, QrCode, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const features = [
  { icon: Shield, title: "Military-Grade Privacy", desc: "Your photos are encrypted and stored on secure servers with zero-knowledge architecture." },
  { icon: Lock, title: "PIN Protected Vaults", desc: "Each vault is secured with a custom PIN. No PIN, no access." },
  { icon: Eye, title: "Self-Destruct", desc: "Vaults auto-destruct after a set number of views or time limit." },
  { icon: Zap, title: "Lightning Upload", desc: "Upload 200+ images in seconds with parallel compression technology." },
  { icon: QrCode, title: "QR Sharing", desc: "Generate beautiful QR codes to share your vault securely." },
  { icon: Gift, title: "Invite & Earn", desc: "Refer friends and earn free Pro plans with our reward system." },
];

const plans = [
  { name: "Pro", price: "$3", credits: "500", features: ["500 Credits", "500 Max Views", "Custom Expiry", "QR Codes", "Download Control"] },
  { name: "Premium", price: "$7", credits: "1200", features: ["1200 Credits", "Unlimited Views", "Custom Expiry", "QR Codes", "Download Control", "Priority Support"], popular: true },
];

const Index = () => (
  <div className="min-h-screen bg-background">
    {/* Nav */}
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="SecretGPV" className="h-8 w-8" />
          <span className="text-xl font-bold text-foreground tracking-tight">Secret<span className="text-primary">GPV</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
        <Link to="/auth">
          <Button size="sm" className="animate-blink-glow">Get Started</Button>
        </Link>
      </div>
    </nav>

    {/* Hero */}
    <section className="pt-28 pb-20 px-4">
      <div className="container mx-auto text-center max-w-3xl">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="SecretGPV" className="h-20 w-20 drop-shadow-[0_0_30px_hsl(142_71%_45%/0.4)]" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          Your Photos, <span className="text-primary">Your Rules</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Share private photos with military-grade security. PIN-protected vaults, self-destructing links, and zero compromise on privacy.
        </p>
        <Link to="/auth">
          <Button size="lg" className="animate-blink-glow text-lg px-10 py-6">
            Get Started — It's Free
          </Button>
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">5 free credits on signup • No credit card required</p>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="py-20 px-4 bg-card/50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Secret<span className="text-primary">GPV</span>?</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all group">
              <f.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing */}
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Simple <span className="text-primary">Pricing</span></h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`relative p-8 rounded-2xl border ${p.popular ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">POPULAR</span>}
              <h3 className="text-2xl font-bold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-primary">{p.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full" variant={p.popular ? "default" : "outline"}>Activate Now</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-10 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="SecretGPV" className="h-6 w-6" />
          <span className="font-semibold">Secret<span className="text-primary">GPV</span></span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </div>
        <p className="text-xs text-muted-foreground">secretgpv@gmail.com</p>
      </div>
    </footer>
  </div>
);

export default Index;
