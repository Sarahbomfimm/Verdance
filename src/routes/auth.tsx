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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-primary)" }} />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center shadow-glow" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">Verdance</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-display font-bold leading-[1.05] mb-4">
              Sua jornada de <span className="text-gradient-primary">investimentos</span>, com clareza absoluta.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Organize compras, categorize aportes, e acompanhe cada centavo do seu orçamento anual.
            </p>
          </div>

          <div className="grid gap-4 max-w-md">
            {[
              { icon: TrendingUp, t: "Acompanhamento em tempo real", d: "Visão clara de cada categoria e produto" },
              { icon: LineChart, t: "Gráficos sofisticados", d: "Veja para onde seu dinheiro está indo" },
              { icon: ShieldCheck, t: "Privacidade garantida", d: "Seus dados, apenas seus" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex items-start gap-3 glass rounded-2xl p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Verdance · Controle de Investimentos</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md p-8 glass-strong shadow-elegant border-border/50">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl">Verdance</span>
          </div>

          <h2 className="text-2xl font-display font-bold mb-1">Bem-vindo</h2>
          <p className="text-sm text-muted-foreground mb-6">Acesso Interno: insira suas credenciais</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-in">E-mail</Label>
              <Input id="email-in" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd-in">Senha</Label>
              <Input id="pwd-in" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full font-semibold" style={{ background: "var(--gradient-primary)" }}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
