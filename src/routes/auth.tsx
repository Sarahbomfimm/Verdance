import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, TrendingUp, ShieldCheck, LineChart } from "lucide-react";
import { BYPASS_AUTH } from "@/lib/auth-mode";

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

  useEffect(() => {
    if (BYPASS_AUTH) {
      navigate({ to: "/dashboard" });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (BYPASS_AUTH) {
      toast.success("Modo desenvolvimento ativo. Entrando sem login.");
      navigate({ to: "/dashboard" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (BYPASS_AUTH) {
      toast.success("Modo desenvolvimento ativo. Entrando sem criar conta.");
      navigate({ to: "/dashboard" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
  };

  const handleGoogle = async () => {
    if (BYPASS_AUTH) {
      toast.success("Modo desenvolvimento ativo. Entrando sem Google.");
      navigate({ to: "/dashboard" });
      return;
    }

    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/dashboard` });
    if (result.error) toast.error("Erro ao entrar com Google");
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
          <p className="text-sm text-muted-foreground mb-6">Acesse sua conta para continuar</p>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-secondary/50">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
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
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-up">E-mail</Label>
                  <Input id="email-up" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd-up">Senha</Label>
                  <Input id="pwd-up" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
                </div>
                <Button type="submit" disabled={loading} className="w-full font-semibold" style={{ background: "var(--gradient-primary)" }}>
                  {loading ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-card px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button onClick={handleGoogle} variant="outline" className="w-full border-border/60 hover:bg-secondary/60">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar com Google
          </Button>
        </Card>
      </div>
    </div>
  );
}
