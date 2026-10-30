import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  LineChart,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getApp } from "firebase/app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Verdance" },
      {
        name: "description",
        content: "Acesse sua conta Verdance para controlar seus investimentos.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div
        className="absolute -top-40 -left-40 w-[450px] h-[450px] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div
        className="absolute -bottom-48 -right-40 w-[480px] h-[480px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "var(--gradient-primary)" }}
      />

      {/* Brand / Info Side */}
      <div className="hidden lg:flex flex-col justify-between p-8 lg:p-10 z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl grid place-items-center shadow-glow"
            style={{ background: "var(--gradient-primary)" }}
          >
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">
            Verdance
          </span>
        </div>

        {/* Main Pitch */}
        <div className="space-y-5 my-auto max-w-md">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold leading-tight mb-2.5">
              Sua jornada de{" "}
              <span className="text-gradient-primary">investimentos</span> com
              clareza total.
            </h1>
            <p className="text-sm text-muted-foreground">
              Organize compras, categorize aportes e acompanhe seu orçamento
              anual em um painel moderno.
            </p>
          </div>

          <div className="grid gap-2.5">
            {[
              {
                icon: TrendingUp,
                t: "Acompanhamento em tempo real",
                d: "Controle claro de categorias e produtos",
              },
              {
                icon: LineChart,
                t: "Gráficos sofisticados",
                d: "Acompanhe seus investimentos",
              },
              {
                icon: ShieldCheck,
                t: "Segurança e privacidade",
                d: "Seus dados protegidos",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div
                key={t}
                className="flex items-center gap-3 glass rounded-xl p-3 transition hover:bg-secondary/40"
              >
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
          <a
            href="https://yourpage.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="yp-footer-link"
          >
            <span className="yp-footer-text">Desenvolvido por</span>
            <span translate="no" className="notranslate yp-footer-badge">
              YourPage
            </span>
          </a>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-10 z-10">
        <div className="relative w-full max-w-[440px]">
          {/* Subtle Ambient Halo Behind Card */}
          <div
            className="absolute -inset-1.5 rounded-[32px] opacity-20 blur-2xl pointer-events-none"
            style={{ background: "var(--gradient-primary)" }}
          />

          <Card className="relative w-full overflow-hidden p-7 sm:p-9 glass-strong shadow-elegant border-border/60 rounded-[28px]">
            {/* Top Gradient Accent Bar */}
            <div
              className="absolute top-0 inset-x-0 h-1.5"
              style={{ background: "var(--gradient-primary)" }}
            />

            {/* Decorative Corner Glow Inside Card */}
            <div
              className="absolute -top-24 -right-24 w-52 h-52 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: "var(--gradient-primary)" }}
            />

            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div
                className="w-9 h-9 rounded-xl grid place-items-center shadow-glow"
                style={{ background: "var(--gradient-primary)" }}
              >
                <TrendingUp className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">Verdance</span>
            </div>

            {/* Card Header */}
            <div className="relative mb-7">
              <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
                Bem-vindo ao{" "}
                <span className="text-gradient-primary">painel</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                Insira suas credenciais para acessar seu ambiente de gestão.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSignIn} className="relative space-y-5">
              <div className="space-y-2 group">
                <Label
                  htmlFor="email-in"
                  className="text-xs font-semibold text-foreground/90"
                >
                  E-mail de acesso
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email-in"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="h-12 pl-11 pr-4 rounded-xl bg-secondary/35 hover:bg-secondary/50 focus-visible:bg-background border-border/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <Label
                  htmlFor="pwd-in"
                  className="text-xs font-semibold text-foreground/90"
                >
                  Senha
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="pwd-in"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 pl-11 pr-11 rounded-xl bg-secondary/35 hover:bg-secondary/50 focus-visible:bg-background border-border/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-semibold text-sm shadow-glow group transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <span>{loading ? "Autenticando..." : "Entrar no painel"}</span>
                  {!loading && (
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  )}
                </Button>
              </div>
            </form>

            {/* Card Trust Footer */}
            <div className="mt-7 pt-5 border-t border-border/40 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Ambiente protegido com controle de acesso por setor</span>
            </div>
          </Card>
        </div>

        <div className="lg:hidden mt-6 flex items-center justify-center gap-2.5 text-xs text-muted-foreground text-center flex-wrap">
          <span>© {new Date().getFullYear()} Verdance</span>
          <span className="opacity-40">•</span>
          <a
            href="https://yourpage.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="yp-footer-link"
          >
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
