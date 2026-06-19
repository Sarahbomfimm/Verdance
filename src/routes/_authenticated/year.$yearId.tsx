import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Pencil, Trash2, Target, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { fmtBRL, fmtCompact } from "@/lib/format";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

export const Route = createFileRoute("/_authenticated/year/$yearId")({
  head: () => ({ meta: [{ title: "Ano — Verdance" }] }),
  component: YearView,
});

const COLOR_PRESETS = [
  "#10b981", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899",
  "#ef4444", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4",
  "#22c55e", "#84cc16", "#eab308", "#fb7185", "#f43f5e",
  "#6366f1", "#4f46e5", "#0ea5e9", "#0891b2", "#7c3aed",
  "#9333ea", "#d946ef", "#a21caf", "#f472b6", "#be123c",
  "#16a34a", "#65a30d", "#ca8a04", "#ea580c", "#dc2626",
  "#334155", "#0f766e", "#1d4ed8", "#312e81", "#7f1d1d",
];

function YearView() {
  const { yearId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [catOpen, setCatOpen] = useState(false);
  const [editYearOpen, setEditYearOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);

  const { data: year } = useQuery({
    queryKey: ["year", yearId],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const docSnap = await getDoc(doc(db, "years", yearId));
      if (!docSnap.exists()) throw new Error("Ano não encontrado");
      return { id: docSnap.id, ...docSnap.data() } as any;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", yearId],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const q = query(collection(db, "categories"), where("year_id", "==", yearId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases-year", yearId],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const q = query(collection(db, "purchases"), where("year_id", "==", yearId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    },
  });

  const totalBudget = year ? parseFloat(year.total_budget as any) : 0;
  const totalSpent = purchases.reduce((s, p) => s + parseFloat(p.amount as any), 0);
  const totalCatBudget = categories.reduce((s, c) => s + parseFloat(c.budget as any), 0);

  const byCat = categories.map(c => {
    const spent = purchases.filter(p => p.category_id === c.id).reduce((s, p) => s + parseFloat(p.amount as any), 0);
    return { ...c, spent, budgetN: parseFloat(c.budget as any) };
  });

  const pieData = byCat.filter(c => c.spent > 0).map(c => ({ name: c.name, value: c.spent, color: c.color }));

  const deleteYear = useMutation({
    mutationFn: async () => {
      const db = getFirestore(getApp());
      await deleteDoc(doc(db, "years", yearId));
    },
    onSuccess: () => {
      toast.success("Ano excluído");
      qc.invalidateQueries({ queryKey: ["years"] });
      qc.invalidateQueries({ queryKey: ["years-nav"] });
      navigate({ to: "/dashboard" });
    },
  });

  return (
    <div className="px-6 pb-6 pt-10 lg:px-10 lg:pb-10 lg:pt-16 max-w-7xl mx-auto space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Visão geral
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-strong border border-border/50 p-8 lg:p-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Ano de investimento
            </p>
            <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight">
              <span className="text-gradient-primary">{year?.year ?? "—"}</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Investido</p>
                <p className="text-2xl font-display font-bold number-tabular">{fmtBRL(totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Orçado total</p>
                <p className="text-2xl font-display font-bold number-tabular text-muted-foreground">{fmtBRL(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditYearOpen(true)} className="border-border/60">
              <Pencil className="w-4 h-4 mr-2" /> Editar
            </Button>
            <Button variant="outline" onClick={() => { if (confirm("Excluir este ano e tudo dentro dele?")) deleteYear.mutate(); }} className="border-border/60 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Big progress bar */}
        <div className="relative mt-8 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-semibold text-foreground">{totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0"}% utilizado</span>
            <span>100%</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0}%`, background: "var(--gradient-primary)" }} />
          </div>
        </div>
      </div>

      {/* Categories + chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl">Categorias</h2>
            <Button onClick={() => { setEditCat(null); setCatOpen(true); }} style={{ background: "var(--gradient-primary)" }} className="font-semibold shadow-glow">
              <Plus className="w-4 h-4 mr-2" /> Nova categoria
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card className="glass border-dashed border-2 border-border/50 p-10 text-center">
              <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Crie categorias para organizar seus investimentos.</p>
              <Button onClick={() => { setEditCat(null); setCatOpen(true); }} variant="outline" className="border-border/60">
                <Plus className="w-4 h-4 mr-2" /> Adicionar categoria
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {byCat.map(c => {
                const pct = c.budgetN > 0 ? Math.min(100, (c.spent / c.budgetN) * 100) : 0;
                return (
                  <Card key={c.id} className="glass-strong border-border/50 p-5 hover:border-primary/40 hover:shadow-glow transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `${c.color}22`, color: c.color }}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-display font-bold">{c.name}</p>
                          <p className="text-xs text-muted-foreground number-tabular">{fmtCompact(c.spent)} / {fmtCompact(c.budgetN)}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); setEditCat(c); setCatOpen(true); }} className="opacity-0 group-hover:opacity-100 transition p-1.5 hover:bg-secondary rounded">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-3">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                    <Link to="/category/$categoryId" params={{ categoryId: c.id }} className="text-xs text-primary hover:underline flex items-center gap-1">
                      Ver produtos e compras <ChevronRight className="w-3 h-3" />
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}

          {totalCatBudget > totalBudget && totalBudget > 0 && (
            <Card className="border-warning/40 bg-warning/5 p-4">
              <p className="text-sm">⚠️ A soma dos orçamentos por categoria ({fmtBRL(totalCatBudget)}) excede o orçamento total do ano ({fmtBRL(totalBudget)}).</p>
            </Card>
          )}
        </div>

        <Card className="glass-strong border-border/50 p-6">
          <h3 className="font-display font-bold text-lg mb-1">Distribuição</h3>
          <p className="text-sm text-muted-foreground mb-4">Por categoria</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy={110}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<DistributionTooltip />} formatter={(v: number) => fmtBRL(v)} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    paddingTop: 16,
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[340px] grid place-items-center text-muted-foreground text-sm text-center px-4">
              Registre compras para ver a distribuição
            </div>
          )}
        </Card>
      </div>

      <CategoryDialog open={catOpen} setOpen={setCatOpen} yearId={yearId} editing={editCat} />
      <EditYearDialog open={editYearOpen} setOpen={setEditYearOpen} year={year} />
    </div>
  );
}

function DistributionTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0];

  return (
    <div className="rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-semibold text-foreground">{item.name}</p>
      <p className="text-xs text-muted-foreground">{fmtBRL(item.value)}</p>
    </div>
  );
}

function CategoryDialog({ open, setOpen, yearId, editing }: any) {
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [budget, setBudget] = useState(editing?.budget?.toString() ?? "");
  const [color, setColor] = useState(editing?.color ?? COLOR_PRESETS[0]);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setBudget(editing?.budget?.toString() ?? "");
    setColor(editing?.color ?? COLOR_PRESETS[0]);
  }, [open, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const auth = getAuth(getApp());
      const user = auth.currentUser;
      if (!user) throw new Error("not auth");
      const db = getFirestore(getApp());
      
      if (editing) {
        await updateDoc(doc(db, "categories", editing.id), { name, budget: parseFloat(budget) || 0, color });
      } else {
        await addDoc(collection(db, "categories"), { user_id: user.uid, year_id: yearId, name, budget: parseFloat(budget) || 0, color, created_at: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      qc.invalidateQueries({ queryKey: ["categories", yearId] });
      setOpen(false);
      setName("");
      setBudget("");
      setColor(COLOR_PRESETS[0]);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const db = getFirestore(getApp());
      await deleteDoc(doc(db, "categories", editing.id));
    },
    onSuccess: () => {
      toast.success("Categoria excluída");
      qc.invalidateQueries({ queryKey: ["categories", yearId] });
      setOpen(false);
      setName("");
      setBudget("");
      setColor(COLOR_PRESETS[0]);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) { setName(editing?.name ?? ""); setBudget(editing?.budget?.toString() ?? ""); setColor(editing?.color ?? COLOR_PRESETS[0]); }
    }}>
      <DialogContent className="glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ações, Renda Fixa, Cripto..." />
          </div>
          <div className="space-y-2">
            <Label>Orçamento previsto (R$)</Label>
            <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "opacity-60 hover:opacity-100"}`}
                  style={{ background: c, ...(color === c && { ['--tw-ring-color' as any]: c }) }} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {editing && (
            <Button variant="outline" onClick={() => { if (confirm("Excluir categoria?")) del.mutate(); }} className="border-destructive/40 text-destructive hover:bg-destructive/10 mr-auto">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={!name || save.isPending} style={{ background: "var(--gradient-primary)" }} className="font-semibold">
            {editing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditYearDialog({ open, setOpen, year }: any) {
  const qc = useQueryClient();
  const [budget, setBudget] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const db = getFirestore(getApp());
      await updateDoc(doc(db, "years", year.id), { total_budget: parseFloat(budget) || 0 });
    },
    onSuccess: () => {
      toast.success("Orçamento atualizado");
      qc.invalidateQueries({ queryKey: ["year", year.id] });
      qc.invalidateQueries({ queryKey: ["years"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && year) setBudget(year.total_budget?.toString() ?? ""); }}>
      <DialogContent className="glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle>Editar orçamento de {year?.year}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Orçamento total previsto (R$)</Label>
            <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending} style={{ background: "var(--gradient-primary)" }} className="font-semibold">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
