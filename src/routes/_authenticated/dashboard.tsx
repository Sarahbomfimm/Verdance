import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, TrendingUp, Wallet, Target, ArrowUpRight, Calendar, Sparkles } from "lucide-react";
import { fmtBRL, fmtCompact } from "@/lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Visão geral — Verdance" }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newBudget, setNewBudget] = useState("");

  const { data: years = [] } = useQuery({
    queryKey: ["years"],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const snap = await getDocs(collection(db, "years"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      return data.sort((a: any, b: any) => b.year - a.year);
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["all-purchases"],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const snap = await getDocs(collection(db, "purchases"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      return data.sort((a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
    },
  });

  const createYear = useMutation({
    mutationFn: async () => {
      const auth = getAuth(getApp());
      const user = auth.currentUser;
      if (!user) throw new Error("not auth");
      
      const db = getFirestore(getApp());
      await addDoc(collection(db, "years"), {
        user_id: user.uid,
        year: parseInt(newYear),
        total_budget: parseFloat(newBudget) || 0,
        created_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success("Ano criado");
      qc.invalidateQueries({ queryKey: ["years"] });
      qc.invalidateQueries({ queryKey: ["years-nav"] });
      setOpen(false); setNewBudget("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Aggregate stats
  const totalBudget = years.reduce((s, y) => s + parseFloat(y.total_budget as any), 0);
  const totalSpent = purchases.reduce((s, p) => s + parseFloat(p.amount as any), 0);
  const remaining = totalBudget - totalSpent;
  const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Chart data: spending by year
  const byYear = years.map(y => {
    const spent = purchases
      .filter(p => p.year_id === y.id)
      .reduce((s, p) => s + parseFloat(p.amount as any), 0);
    return { year: y.year.toString(), Orçado: parseFloat(y.total_budget as any), Investido: spent };
  }).reverse();

  // Monthly trend (current year if any)
  const currentYear = years[0];
  const monthlyByIndex = Array.from({ length: 12 }, () => 0);
  if (currentYear) {
    purchases.filter(p => p.year_id === currentYear.id).forEach(p => {
      const monthIndex = new Date(p.purchase_date).getMonth();
      monthlyByIndex[monthIndex] += parseFloat(p.amount as any);
    });
  }
  const monthLabels = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const monthlyData = monthlyByIndex
    .map((value, index) => ({ month: monthLabels[index], value, index }))
    .filter(item => item.value > 0 || item.index <= new Date().getMonth())
    .sort((a, b) => a.index - b.index)
    .map(({ month, value }) => ({ month, value }));

  return (
    <div className="px-6 pb-6 pt-10 lg:px-10 lg:pb-10 lg:pt-16 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Olá, investidor
          </p>
          <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Sua <span className="text-gradient-primary">jornada</span> em números
          </h1>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-glow" style={{ background: "var(--gradient-primary)" }}>
              <Plus className="w-4 h-4 mr-2" /> Novo ano
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/50">
            <DialogHeader>
              <DialogTitle>Novo ano de investimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input type="number" value={newYear} onChange={e => setNewYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Orçamento total previsto (R$)</Label>
                <Input type="number" step="0.01" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createYear.mutate()} disabled={createYear.isPending} style={{ background: "var(--gradient-primary)" }} className="font-semibold">
                Criar ano
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Orçado total" value={fmtBRL(totalBudget)} icon={Target} accent="primary" />
        <Kpi label="Investido" value={fmtBRL(totalSpent)} icon={TrendingUp} accent="gold" />
        <Kpi label="Disponível" value={fmtBRL(remaining)} icon={Wallet} accent={remaining >= 0 ? "primary" : "destructive"} />
        <Kpi label="Progresso" value={`${progress.toFixed(1)}%`} icon={ArrowUpRight} accent="gold" sub={`${years.length} ${years.length === 1 ? "ano" : "anos"}`} />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-strong border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg">Investimento por ano</h3>
              <p className="text-sm text-muted-foreground">Orçado vs realizado</p>
            </div>
          </div>
          {byYear.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="year" stroke="oklch(0.68 0.025 180)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.025 180)" fontSize={12} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.20 0.02 180)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Bar dataKey="Orçado" fill="oklch(0.83 0.13 88)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Investido" fill="oklch(0.78 0.17 162)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Crie um ano para começar" />}
        </Card>

        <Card className="glass-strong border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg">Tendência mensal</h3>
              <p className="text-sm text-muted-foreground">{currentYear?.year ?? "—"}</p>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.17 162)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.17 162)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="month" stroke="oklch(0.68 0.025 180)" fontSize={12} />
                <YAxis stroke="oklch(0.68 0.025 180)" fontSize={12} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.20 0.02 180)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                  formatter={(v: number) => fmtBRL(v)}
                />
                <Area type="monotone" dataKey="value" stroke="oklch(0.78 0.17 162)" strokeWidth={2.5} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Sem compras registradas" />}
        </Card>
      </div>

      {/* Years grid */}
      <div>
        <h2 className="font-display font-bold text-2xl mb-4">Seus anos</h2>
        {years.length === 0 ? (
          <Card className="glass border-dashed border-2 border-border/50 p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center mb-4" style={{ background: "var(--gradient-primary)" }}>
              <Calendar className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Comece sua jornada</h3>
            <p className="text-muted-foreground mb-6">Crie seu primeiro ano de investimento para acompanhar tudo.</p>
            <Button onClick={() => setOpen(true)} style={{ background: "var(--gradient-primary)" }} className="font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Criar primeiro ano
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {years.map(y => {
              const spent = purchases.filter(p => p.year_id === y.id).reduce((s, p) => s + parseFloat(p.amount as any), 0);
              const budget = parseFloat(y.total_budget as any);
              const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
              return (
                <Link key={y.id} to="/year/$yearId" params={{ yearId: y.id }}>
                  <Card className="glass-strong border-border/50 p-6 hover:border-primary/40 transition-all hover:shadow-glow group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Ano</p>
                        <p className="font-display text-3xl font-bold">{y.year}</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Investido</span>
                        <span className="font-semibold number-tabular">{fmtBRL(spent)}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Orçado</span>
                        <span className="text-muted-foreground number-tabular">{fmtBRL(budget)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--gradient-primary)" }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% utilizado</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent, sub }: any) {
  const accentBg = accent === "gold" ? "bg-accent/10" : accent === "destructive" ? "bg-destructive/10" : "bg-primary/10";
  const accentFg = accent === "gold" ? "text-accent" : accent === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Card className="glass-strong border-border/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <div className={`w-8 h-8 rounded-lg grid place-items-center ${accentBg}`}>
          <Icon className={`w-4 h-4 ${accentFg}`} />
        </div>
      </div>
      <p className="text-2xl font-display font-bold number-tabular">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function EmptyChart({ msg }: { msg: string }) {
  return <div className="h-[260px] grid place-items-center text-muted-foreground text-sm">{msg}</div>;
}
