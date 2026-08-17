import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, TrendingUp, ShieldCheck, LineChart } from "lucide-react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getApp } from "firebase/app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Verdance" },
      { name: "description", content: "Acesse sua conta Verdance para controlar seus investimentos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const auth = getAuth(getApp());
      await signInWithEmailAndPassword(auth, email, password);
      
      toast.success("Bem-vindo ao painel!");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      console.error("Erro ao entrar:", error);
      toast.error(error.message || "Credenciais inválidas ou erro ao entrar.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:grid lg:grid-cols-2 relative overflow-hidden bg-background">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full opacity-25 blur-3xl" style={{ background: "var(--gradient-primary)" }} />

      {/* Brand / Info Side */}
      <div className="hidden lg:flex flex-col justify-between p-8 lg:p-10 z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shadow-glow" style={{ background: "var(--gradient-primary)" }}>
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">Verdance</span>
        </div>

        {/* Main Pitch */}
        <div className="space-y-5 my-auto max-w-md">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold leading-tight mb-2.5">
              Sua jornada de <span className="text-gradient-primary">investimentos</span> com clareza total.
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize compras, categorize aportes e acompanhe seu orçamento anual em um painel moderno.
            </p>
          </div>

          <div className="grid gap-2.5">
            {[
              { icon: TrendingUp, t: "Acompanhamento em tempo real", d: "Controle claro de categorias e produtos" },
              { icon: LineChart, t: "Gráficos sofisticados", d: "Acompanhe seus investimentos" },
              { icon: ShieldCheck, t: "Segurança e Privacidade", d: "Seus dados protegidos" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-center gap-3 glass rounded-xl p-3 transition hover:bg-secondary/40">
                <div className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center shrink-0 text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{t}</p>
                  <p className="text-[11px] text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border/20">
          <span>© {new Date().getFullYear()} Verdance</span>
          <span className="opacity-40">•</span>
          <a href="https://yourpage.com.br" target="_blank" rel="noopener noreferrer" className="yp-footer-link">
            <span className="yp-footer-text">Desenvolvido por</span>
            <span translate="no" className="notranslate yp-footer-badge">
              YourPage
            </span>
          </a>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-10 z-10">
        <Card className="w-full max-w-md p-6 lg:p-8 glass-strong shadow-elegant border-border/50 rounded-3xl">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl grid place-items-center shadow-glow" style={{ background: "var(--gradient-primary)" }}>
              <TrendingUp className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Verdance</span>
          </div>

          <h2 className="text-2xl font-display font-bold mb-1">Bem-vindo</h2>
          <p className="text-xs text-muted-foreground mb-6">Insira suas credenciais para entrar no sistema</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email-in" className="text-xs">E-mail</Label>
              <Input id="email-in" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="h-10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwd-in" className="text-xs">Senha</Label>
              <Input id="pwd-in" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-10 text-sm" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10 font-semibold shadow-glow mt-2" style={{ background: "var(--gradient-primary)" }}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>

        <div className="lg:hidden mt-6 flex items-center justify-center gap-2.5 text-xs text-muted-foreground text-center flex-wrap">
          <span>© {new Date().getFullYear()} Verdance</span>
          <span className="opacity-40">•</span>
          <a href="https://yourpage.com.br" target="_blank" rel="noopener noreferrer" className="yp-footer-link">
            <span className="yp-footer-text">Desenvolvido por</span>
            <span translate="no" className="notranslate yp-footer-badge">
              YourPage
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
