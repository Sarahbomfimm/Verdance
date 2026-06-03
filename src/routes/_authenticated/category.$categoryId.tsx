import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowLeft, Pencil, Trash2, Package, ShoppingCart, MessageSquareText } from "lucide-react";
import { fmtBRL, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { BYPASS_AUTH } from "@/lib/auth-mode";
import { dataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/category/$categoryId")({
  head: () => ({ meta: [{ title: "Categoria — Verdance" }] }),
  component: CategoryView,
});

function CategoryView() {
  const { categoryId } = Route.useParams();
  const qc = useQueryClient();
  const [prodOpen, setProdOpen] = useState(false);
  const [editProd, setEditProd] = useState<any>(null);
  const [purchOpen, setPurchOpen] = useState(false);
  const [editPurch, setEditPurch] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: category } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      if (BYPASS_AUTH) {
        const data = await dataStore.getCategoryWithYear(categoryId);
        if (!data) throw new Error("Categoria não encontrada");
        return data;
      }

      const { data, error } = await supabase.from("categories").select("*, years(year)").eq("id", categoryId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", categoryId],
    queryFn: async () => {
      if (BYPASS_AUTH) {
        return dataStore.getProductsByCategory(categoryId);
      }

      const { data } = await supabase.from("products").select("*").eq("category_id", categoryId).order("created_at");
      return data ?? [];
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases-cat", categoryId],
    queryFn: async () => {
      if (BYPASS_AUTH) {
        return dataStore.getPurchasesByCategory(categoryId);
      }

      const { data } = await supabase.from("purchases").select("*, products(name)").eq("category_id", categoryId).order("purchase_date", { ascending: false });
      return data ?? [];
    },
  });

  const totalSpent = purchases.reduce((s, p) => s + parseFloat(p.amount as any), 0);
  const catBudget = category ? parseFloat(category.budget as any) : 0;
  const pct = catBudget > 0 ? Math.min(100, (totalSpent / catBudget) * 100) : 0;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <Link to="/year/$yearId" params={{ yearId: category?.year_id ?? "" }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar para {category?.years?.year ?? "ano"}
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-strong border border-border/50 p-8 lg:p-10">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: category?.color ?? "#10b981" }} />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Categoria · {category?.years?.year}</p>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl grid place-items-center" style={{ background: `${category?.color}25`, color: category?.color }}>
              <Package className="w-7 h-7" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight">{category?.name}</h1>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Investido</p>
              <p className="text-2xl font-display font-bold number-tabular">{fmtBRL(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Orçado</p>
              <p className="text-2xl font-display font-bold number-tabular text-muted-foreground">{fmtBRL(catBudget)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Disponível</p>
              <p className="text-2xl font-display font-bold number-tabular" style={{ color: catBudget - totalSpent >= 0 ? category?.color : "var(--destructive)" }}>
                {fmtBRL(catBudget - totalSpent)}
              </p>
            </div>
          </div>

          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: category?.color }} />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-2xl">Produtos</h2>
          <Button onClick={() => { setEditProd(null); setProdOpen(true); }} variant="outline" className="border-border/60">
            <Plus className="w-4 h-4 mr-2" /> Novo produto
          </Button>
        </div>

        {products.length === 0 ? (
          <Card className="glass border-dashed border-2 border-border/50 p-8 text-center text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3" />
            <p>Crie produtos dentro desta categoria com seus orçamentos próprios.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(p => {
              const spent = purchases.filter(pu => pu.product_id === p.id).reduce((s, pu) => s + parseFloat(pu.amount as any), 0);
              const pb = parseFloat(p.budget as any);
              const ppct = pb > 0 ? Math.min(100, (spent / pb) * 100) : 0;
              return (
                <Card key={p.id} className="glass-strong border-border/50 p-4 group hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground number-tabular mt-0.5">{fmtBRL(spent)} / {fmtBRL(pb)}</p>
                    </div>
                    <button onClick={() => { setEditProd(p); setProdOpen(true); }} className="opacity-0 group-hover:opacity-100 transition p-1.5 hover:bg-secondary rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${ppct}%`, background: category?.color }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{purchases.filter(pu => pu.product_id === p.id).length} compras</p>
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Ver compras
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-2xl">Compras</h2>
          <Button onClick={() => { setEditPurch(null); setPurchOpen(true); }} style={{ background: "var(--gradient-primary)" }} className="font-semibold shadow-glow">
            <Plus className="w-4 h-4 mr-2" /> Nova compra
          </Button>
        </div>

        {purchases.length === 0 ? (
          <Card className="glass border-dashed border-2 border-border/50 p-10 text-center">
            <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Nenhuma compra registrada nesta categoria.</p>
            <Button onClick={() => { setEditPurch(null); setPurchOpen(true); }} style={{ background: "var(--gradient-primary)" }} className="font-semibold">
              <Plus className="w-4 h-4 mr-2" /> Registrar primeira compra
            </Button>
          </Card>
        ) : (
          <Card className="glass-strong border-border/50 overflow-hidden">
            <div className="divide-y divide-border/50">
              {purchases.map(p => (
                <div key={p.id} className="p-4 hover:bg-secondary/30 transition group flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: `${category?.color}22`, color: category?.color }}>
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-semibold">{p.products?.name ?? "Compra"}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.purchase_date)}</p>
                    </div>
                    {p.notes && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1.5">
                        <MessageSquareText className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold number-tabular">{fmtBRL(p.amount)}</p>
                    <button onClick={() => { setEditPurch(p); setPurchOpen(true); }} className="text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition">
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ProductDialog open={prodOpen} setOpen={setProdOpen} categoryId={categoryId} editing={editProd} />
      <PurchaseDialog open={purchOpen} setOpen={setPurchOpen} category={category} products={products} editing={editPurch} />
      <ProductPurchasesDialog
        open={Boolean(selectedProduct)}
        setOpen={(open: boolean) => !open && setSelectedProduct(null)}
        product={selectedProduct}
        purchases={purchases.filter(p => p.product_id === selectedProduct?.id)}
      />
    </div>
  );
}

function ProductPurchasesDialog({ open, setOpen, product, purchases }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong border-border/50 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compras de {product?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma compra registrada para este produto.</p>
          ) : (
            purchases.map((purchase: any) => (
              <div key={purchase.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                <div>
                  <p className="font-medium">{fmtDate(purchase.purchase_date)}</p>
                  <p className="text-xs text-muted-foreground">{purchase.notes || "Sem observações"}</p>
                </div>
                <p className="font-display font-bold number-tabular">{fmtBRL(purchase.amount)}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ open, setOpen, categoryId, editing }: any) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setBudget(editing?.budget?.toString() ?? "");
  }, [open, editing]);

  const save = useMutation({
    mutationFn: async () => {
      if (BYPASS_AUTH) {
        await dataStore.upsertProduct({
          id: editing?.id,
          category_id: categoryId,
          name,
          budget: parseFloat(budget) || 0,
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not auth");
      if (editing) {
        const { error } = await supabase.from("products").update({ name, budget: parseFloat(budget) || 0 }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({ user_id: user.id, category_id: categoryId, name, budget: parseFloat(budget) || 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado" : "Produto criado");
      qc.invalidateQueries({ queryKey: ["products", categoryId] });
      setOpen(false);
      setName("");
      setBudget("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (BYPASS_AUTH) {
        await dataStore.deleteProduct(editing.id);
        return;
      }

      const { error } = await supabase.from("products").delete().eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["products", categoryId] });
      setOpen(false);
      setName("");
      setBudget("");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setName("");
          setBudget("");
        }
      }}
    >
      <DialogContent className="glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do produto</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: PETR4, Tesouro Selic..." />
          </div>
          <div className="space-y-2">
            <Label>Orçamento previsto (R$)</Label>
            <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {editing && (
            <Button variant="outline" onClick={() => { if (confirm("Excluir produto?")) del.mutate(); }} className="border-destructive/40 text-destructive hover:bg-destructive/10 mr-auto">
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

function PurchaseDialog({ open, setOpen, category, products, editing }: any) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [installments, setInstallments] = useState("1");

  useEffect(() => {
    if (!open) return;
    setProductId(editing?.product_id ?? "");
    setAmount(editing?.amount?.toString() ?? "");
    setDate(editing?.purchase_date ?? new Date().toISOString().split("T")[0]);
    setNotes(editing?.notes ?? "");
    setInstallments("1");
  }, [open, editing]);

  const addMonths = (isoDate: string, count: number) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const next = new Date(year, month - 1, day);
    next.setMonth(next.getMonth() + count);
    const yyyy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, "0");
    const dd = String(next.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const save = useMutation({
    mutationFn: async () => {
      const installmentCount = Math.max(1, parseInt(installments) || 1);
      const totalAmount = parseFloat(amount) || 0;

      if (BYPASS_AUTH) {
        if (editing || installmentCount === 1) {
          await dataStore.upsertPurchase({
            id: editing?.id,
            year_id: category.year_id,
            category_id: category.id,
            amount: totalAmount,
            purchase_date: date,
            notes: notes || null,
            product_id: productId || null,
          });
        } else {
          const baseValue = Math.floor((totalAmount / installmentCount) * 100) / 100;
          let remaining = totalAmount;

          for (let index = 0; index < installmentCount; index += 1) {
            const isLast = index === installmentCount - 1;
            const installmentAmount = isLast ? Number(remaining.toFixed(2)) : baseValue;
            remaining -= installmentAmount;
            const combinedNotes = `${notes ? `${notes} · ` : ""}Parcela ${index + 1}/${installmentCount}`;

            await dataStore.upsertPurchase({
              year_id: category.year_id,
              category_id: category.id,
              amount: installmentAmount,
              purchase_date: addMonths(date, index),
              notes: combinedNotes,
              product_id: productId || null,
            });
          }
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not auth");
      const payload = {
        amount: parseFloat(amount) || 0,
        purchase_date: date,
        notes: notes || null,
        product_id: productId || null,
      };
      if (editing) {
        const { error } = await supabase.from("purchases").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("purchases").insert({
          ...payload, user_id: user.id, year_id: category.year_id, category_id: category.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Compra atualizada" : "Compra registrada");
      qc.invalidateQueries({ queryKey: ["purchases-cat", category.id] });
      qc.invalidateQueries({ queryKey: ["purchases-year", category.year_id] });
      qc.invalidateQueries({ queryKey: ["all-purchases"] });
      setOpen(false);
      setProductId("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setInstallments("1");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (BYPASS_AUTH) {
        await dataStore.deletePurchase(editing.id);
        return;
      }

      const { error } = await supabase.from("purchases").delete().eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compra excluída");
      qc.invalidateQueries({ queryKey: ["purchases-cat", category.id] });
      qc.invalidateQueries({ queryKey: ["purchases-year", category.year_id] });
      qc.invalidateQueries({ queryKey: ["all-purchases"] });
      setOpen(false);
      setProductId("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setInstallments("1");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) {
        setProductId("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setNotes("");
        setInstallments("1");
      }
    }}>
      <DialogContent className="glass-strong border-border/50 max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar compra" : "Nova compra"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Selecione um produto (opcional)" /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          {!editing && (
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={installments}
                onChange={e => setInstallments(e.target.value)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">Informe 1 para compra à vista. Se for maior que 1, o sistema divide em parcelas mensais.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre essa compra..." rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {editing && (
            <Button variant="outline" onClick={() => { if (confirm("Excluir compra?")) del.mutate(); }} className="border-destructive/40 text-destructive hover:bg-destructive/10 mr-auto">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={!amount || save.isPending} style={{ background: "var(--gradient-primary)" }} className="font-semibold">
            {editing ? "Salvar" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
