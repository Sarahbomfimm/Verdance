import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { getApp } from "firebase/app";
import {
  LayoutDashboard, Calendar, FolderTree, Plus, LogOut, Sparkles,
  Settings, Menu, X
} from "lucide-react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const { data: years } = useQuery({
    queryKey: ["years-nav"],
    queryFn: async () => {
      const db = getFirestore(getApp());
      const snap = await getDocs(collection(db, "years"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      return data.sort((a: any, b: any) => b.year - a.year);
    },
  });

  const handleLogout = async () => {
    try {
      const auth = getAuth(getApp());
      await signOut(auth);
      navigate({ to: "/auth" });
    } catch (error) {
      toast.error("Erro ao sair da conta");
    }
  };

  const userEmail = getAuth(getApp()).currentUser?.email;

  const nav = [
    { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 transition-transform glass-strong border-r border-border/50 flex flex-col",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl grid place-items-center shadow-glow" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Verdance</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 -mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {nav.map((item, index) => {
              const active = pathname === item.to;
              return (
                <Link key={item.to} to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    index === 0 && "mt-1",
                    active
                      ? "bg-primary/15 text-primary shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 mb-2 px-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Anos</p>
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary">
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            {years?.map(y => {
              const to = `/year/${y.id}`;
              const active = pathname === to;
              return (
                <Link key={y.id} to="/year/$yearId" params={{ yearId: y.id }}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm transition-all group",
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  )}>
                  <span className="flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    {y.year}
                  </span>
                </Link>
              );
            })}
            {years?.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Crie seu primeiro ano</p>
            )}
          </div>
        </nav>

        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-semibold" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
              {userEmail?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">Investidor</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden glass border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Verdance</span>
          </Link>
          <div className="w-9" />
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
