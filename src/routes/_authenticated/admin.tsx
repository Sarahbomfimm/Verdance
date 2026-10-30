import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Users,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Mail,
  FolderTree,
  Check,
  Sparkles,
  KeyRound,
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import {
  useUserAccess,
  normalizeEmail,
  createFirebaseUserFromAdmin,
  type UserAccessRecord,
} from "@/hooks/useUserAccess";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel admin — Verdance" }] }),
  component: AdminPanelPage,
});

function AdminPanelPage() {
  const qc = useQueryClient();
  const {
    userEmail,
    normalizedEmail,
    allAccessRecords,
    isAdmin,
    isLoadingAccess,
  } = useUserAccess();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccessRecord | null>(null);

  const { data: years = [] } = useQuery({
    queryKey: ["years"],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const snap = await getDocs(collection(db, "years"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      return data.sort((a: any, b: any) => b.year - a.year);
    },
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["all-categories-admin"],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const snap = await getDocs(collection(db, "categories"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
  });

  const yearMap = Object.fromEntries(years.map((y: any) => [y.id, y.year]));

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const db = getFirestore(getApp());
      await deleteDoc(doc(db, "user_access", id));
    },
    onSuccess: () => {
      toast.success("Vínculo de usuário removido");
      qc.invalidateQueries({ queryKey: ["user-access-records"] });
    },
    onError: (e: any) => {
      toast.error("Erro ao remover usuário: " + e.message);
    },
  });

  if (isLoadingAccess) {
    return (
      <div className="px-6 py-16 max-w-7xl mx-auto text-center text-muted-foreground">
        Carregando permissões...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="px-6 pb-6 pt-10 lg:px-10 lg:pb-10 lg:pt-16 max-w-3xl mx-auto">
        <Card className="glass-strong border-border/50 p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 text-destructive grid place-items-center">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-display font-bold">
            Acesso restrito ao administrador
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sua conta ({userEmail}) possui acesso exclusivo ao seu setor e não
            tem permissão para gerenciar usuários no painel administrativo.
          </p>
          <div className="pt-2">
            <Link to="/dashboard">
              <Button
                style={{ background: "var(--gradient-primary)" }}
                className="font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a visão geral
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const sectorUsersCount = allAccessRecords.filter(
    (r) => r.role === "sector"
  ).length;
  const adminUsersCount =
    allAccessRecords.filter((r) => r.role === "admin").length +
    (allAccessRecords.some((r) => normalizeEmail(r.email) === normalizedEmail)
      ? 0
      : 1);

  return (
    <div className="px-6 pb-6 pt-10 lg:px-10 lg:pb-10 lg:pt-16 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Controle de
            acessos e setores
          </p>
          <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Painel <span className="text-gradient-primary">administrativo</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Crie usuários, vincule o e-mail de cada setor às suas respectivas
            categorias e controle quem pode visualizar cada módulo.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingUser(null);
            setDialogOpen(true);
          }}
          className="font-semibold shadow-glow"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo usuário
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-strong border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Usuários por setor
            </p>
            <div className="w-8 h-8 rounded-lg grid place-items-center bg-primary/10 text-primary">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold number-tabular">
            {sectorUsersCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Acesso restrito à categoria vinculada
          </p>
        </Card>

        <Card className="glass-strong border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Administradores
            </p>
            <div className="w-8 h-8 rounded-lg grid place-items-center bg-accent/10 text-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold number-tabular">
            {adminUsersCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Visão total de todos os setores
          </p>
        </Card>

        <Card className="glass-strong border-border/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Categorias disponíveis
            </p>
            <div className="w-8 h-8 rounded-lg grid place-items-center bg-primary/10 text-primary">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-display font-bold number-tabular">
            {allCategories.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Módulos de investimento ativos
          </p>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-2xl">
          Usuários e permissões
        </h2>

        <div className="grid gap-4">
          {/* Current logged-in admin card if not explicitly in user_access */}
          {!allAccessRecords.some(
            (r) => normalizeEmail(r.email) === normalizedEmail
          ) &&
            userEmail && (
              <Card className="glass-strong border-primary/30 p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl grid place-items-center font-display font-bold text-base shrink-0 shadow-glow"
                    style={{
                      background: "var(--gradient-primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {userEmail[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-base truncate">
                        Administrador principal (você)
                      </p>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        Administrador
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" /> {userEmail}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Acesso liberado a todas as categorias, anos e configurações.
                </div>
              </Card>
            )}

          {allAccessRecords.length === 0 ? (
            <Card className="glass border-dashed border-2 border-border/50 p-10 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display font-bold text-lg mb-1">
                Nenhum usuário de setor vinculado ainda
              </h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                Adicione o e-mail de um setor (ex: marketing@empresa.com) e
                escolha qual categoria ele poderá acessar.
              </p>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setDialogOpen(true);
                }}
                style={{ background: "var(--gradient-primary)" }}
                className="font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" /> Criar primeiro usuário
              </Button>
            </Card>
          ) : (
            allAccessRecords.map((record) => {
              const linkedCats = allCategories.filter(
                (c: any) =>
                  record.allowed_category_ids?.includes(c.id) ||
                  record.allowed_category_names
                    ?.map((n) => n.trim().toLowerCase())
                    .includes((c.name || "").trim().toLowerCase())
              );

              return (
                <Card
                  key={record.id}
                  className="glass-strong border-border/50 p-5 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl grid place-items-center font-display font-bold text-base shrink-0",
                        record.role === "admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      {(record.name?.[0] || record.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-bold text-base">
                          {record.name || record.email}
                        </p>
                        {record.role === "admin" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary">
                            Administrador
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent">
                            Acesso por setor
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> {record.email}
                      </p>

                      {record.role === "sector" ? (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted-foreground mr-1">
                            Categorias liberadas:
                          </span>
                          {linkedCats.length > 0 ? (
                            linkedCats.map((cat: any) => (
                              <Link
                                key={cat.id}
                                to="/category/$categoryId"
                                params={{ categoryId: cat.id }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary/70 hover:bg-secondary transition border border-border/40"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: cat.color || "#10b981",
                                  }}
                                />
                                <span>{cat.name}</span>
                                {yearMap[cat.year_id] && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ({yearMap[cat.year_id]})
                                  </span>
                                )}
                              </Link>
                            ))
                          ) : (record.allowed_category_names?.length ?? 0) > 0 ? (
                            record.allowed_category_names?.map((catName) => (
                              <span
                                key={catName}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary/70 border border-border/40"
                              >
                                <FolderTree className="w-3 h-3 text-primary" />
                                {catName}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-destructive font-medium">
                              Nenhuma categoria vinculada
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground pt-0.5">
                          Pode visualizar e editar todos os setores e gerenciar
                          usuários.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(record);
                        setDialogOpen(true);
                      }}
                      className="border-border/60"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (
                          confirm(
                            `Remover as permissões vinculadas ao e-mail "${record.email}"?`
                          )
                        ) {
                          deleteUserMutation.mutate(record.id);
                        }
                      }}
                      className="border-border/60 text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                      title="Remover vínculo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <UserAccessDialog
        open={dialogOpen}
        setOpen={setDialogOpen}
        editing={editingUser}
        allCategories={allCategories}
        yearMap={yearMap}
        existingRecords={allAccessRecords}
      />
    </div>
  );
}

function UserAccessDialog({
  open,
  setOpen,
  editing,
  allCategories,
  yearMap,
  existingRecords,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  editing: UserAccessRecord | null;
  allCategories: any[];
  yearMap: Record<string, any>;
  existingRecords: UserAccessRecord[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"sector" | "admin">("sector");
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedCatNames, setSelectedCatNames] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setEmail(editing?.email ?? "");
    setPassword("");
    setShowPassword(false);
    setRole(editing?.role ?? "sector");
    setSelectedCatIds(editing?.allowed_category_ids ?? []);
    setSelectedCatNames(editing?.allowed_category_names ?? []);
  }, [open, editing]);

  const toggleCategory = (cat: any) => {
    const isSelected =
      selectedCatIds.includes(cat.id) ||
      selectedCatNames
        .map((n) => n.trim().toLowerCase())
        .includes((cat.name || "").trim().toLowerCase());

    if (isSelected) {
      setSelectedCatIds((prev) => prev.filter((id) => id !== cat.id));
      const remainingIds = selectedCatIds.filter((id) => id !== cat.id);
      const stillHasSameName = allCategories.some(
        (c) =>
          remainingIds.includes(c.id) &&
          (c.name || "").trim().toLowerCase() ===
            (cat.name || "").trim().toLowerCase()
      );
      if (!stillHasSameName) {
        setSelectedCatNames((prev) =>
          prev.filter(
            (n) =>
              n.trim().toLowerCase() !== (cat.name || "").trim().toLowerCase()
          )
        );
      }
    } else {
      setSelectedCatIds((prev) =>
        prev.includes(cat.id) ? prev : [...prev, cat.id]
      );
      const cleanName = (cat.name || "").trim();
      if (cleanName) {
        setSelectedCatNames((prev) =>
          prev.some((n) => n.trim().toLowerCase() === cleanName.toLowerCase())
            ? prev
            : [...prev, cleanName]
        );
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanEmail = normalizeEmail(email);
      if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("Informe um e-mail válido.");
      }

      if (role === "sector" && selectedCatIds.length === 0 && selectedCatNames.length === 0) {
        throw new Error(
          "Selecione pelo menos uma categoria para vincular a este usuário."
        );
      }

      let authCreatedMsg = "";
      if (!editing && password.trim().length > 0) {
        if (password.trim().length < 6) {
          throw new Error("A senha precisa ter pelo menos 6 caracteres.");
        }
        const authResult = await createFirebaseUserFromAdmin(
          cleanEmail,
          password.trim()
        );
        if (authResult.createdInAuth) {
          authCreatedMsg = " Conta de login criada com sucesso!";
        } else if (authResult.alreadyExisted) {
          authCreatedMsg =
            " (O e-mail já possuía conta de login; permissões atualizadas!)";
        }
      }

      const db = getFirestore(getApp());
      const payload = {
        name: name.trim() || selectedCatNames.join(", ") || cleanEmail,
        email: cleanEmail,
        role,
        allowed_category_ids: role === "sector" ? selectedCatIds : [],
        allowed_category_names: role === "sector" ? selectedCatNames : [],
        updated_at: new Date().toISOString(),
      };

      const existingForEmail = existingRecords.find(
        (r) => normalizeEmail(r.email) === cleanEmail
      );
      const targetDocId = editing?.id || existingForEmail?.id;

      if (targetDocId) {
        await updateDoc(doc(db, "user_access", targetDocId), payload);
      } else {
        await addDoc(collection(db, "user_access"), {
          ...payload,
          created_at: new Date().toISOString(),
        });
      }

      return authCreatedMsg;
    },
    onSuccess: (authMsg) => {
      toast.success(
        (editing ? "Permissões atualizadas!" : "Usuário vinculado com sucesso!") +
          (authMsg || "")
      );
      qc.invalidateQueries({ queryKey: ["user-access-records"] });
      setOpen(false);
    },
    onError: (e: any) => {
      toast.error(e.message || "Erro ao salvar usuário.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong border-border/50 max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {editing ? "Editar usuário" : "Novo usuário"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3 overflow-y-auto pr-1 scrollbar-thin flex-1">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome ou setor</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marketing, Comercial..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>E-mail do usuário</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marketing@empresa.com"
              />
            </div>
          </div>

          {!editing && (
            <div className="space-y-1.5 rounded-2xl border border-border/50 bg-secondary/20 p-4">
              <Label className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-primary" /> Senha de
                acesso (opcional se já possuir conta)
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ao preencher a senha, o login já é criado automaticamente sem
                desconectar sua conta.
              </p>
            </div>
          )}

          {/* Role Selector */}
          <div className="space-y-2">
            <Label>Tipo de acesso</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("sector")}
                className={cn(
                  "text-left p-3.5 rounded-2xl border transition-all",
                  role === "sector"
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/50 bg-background/40 hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm">
                    Restrito ao setor
                  </span>
                  <Building2
                    className={cn(
                      "w-4 h-4",
                      role === "sector"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Vê apenas o total geral na visão geral e os detalhes da
                  categoria vinculada.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={cn(
                  "text-left p-3.5 rounded-2xl border transition-all",
                  role === "admin"
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/50 bg-background/40 hover:bg-secondary/40"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm">
                    Administrador
                  </span>
                  <ShieldCheck
                    className={cn(
                      "w-4 h-4",
                      role === "admin"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Acesso completo a todos os setores, orçamentos e ao painel
                  administrativo.
                </p>
              </button>
            </div>
          </div>

          {/* Category Multi-Select */}
          {role === "sector" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label>Vincular categorias</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedCatIds.length} selecionada(s)
                </span>
              </div>

              {allCategories.length === 0 ? (
                <Card className="p-4 text-center text-xs text-muted-foreground border-dashed">
                  Nenhuma categoria cadastrada nos anos ainda. Crie uma categoria
                  dentro de um ano primeiro.
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 scrollbar-thin">
                  {allCategories.map((cat: any) => {
                    const isChecked =
                      selectedCatIds.includes(cat.id) ||
                      selectedCatNames
                        .map((n) => n.trim().toLowerCase())
                        .includes((cat.name || "").trim().toLowerCase());

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition-all",
                          isChecked
                            ? "border-primary bg-primary/10 text-foreground font-semibold"
                            : "border-border/50 bg-background/40 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || "#10b981" }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm truncate">{cat.name}</p>
                            {yearMap[cat.year_id] && (
                              <p className="text-[10px] text-muted-foreground">
                                Ano {yearMap[cat.year_id]}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md grid place-items-center shrink-0 border transition",
                            isChecked
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border/60"
                          )}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/30 gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border/60"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{ background: "var(--gradient-primary)" }}
            className="font-semibold shadow-glow"
          >
            {saveMutation.isPending
              ? "Salvando..."
              : editing
              ? "Salvar"
              : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
