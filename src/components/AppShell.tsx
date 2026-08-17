import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { getApp } from "firebase/app";
import {
  LayoutDashboard, Calendar, FolderTree, Plus, LogOut, Sparkles,
  Settings, Menu, X, Sun, Moon, ChevronLeft, ChevronRight
} from "lucide-react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "../hooks/useTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const { theme, toggle } = useTheme();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

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
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 left-0 z-50 h-screen shrink-0 transition-all duration-300 ease-in-out glass-strong border-r border-border/50 flex flex-col print:hidden",
            collapsed ? "lg:w-20 w-72" : "w-72",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Header / Logo */}
          {collapsed ? (
            <div className="p-3 flex flex-col items-center gap-2.5 border-b border-border/30 shrink-0">
              <div className="w-full flex items-center justify-center relative">
                <Link to="/dashboard" title="Verdance">
                  <div className="w-9 h-9 rounded-xl grid place-items-center shadow-glow shrink-0 transition-transform hover:scale-105" style={{ background: "var(--gradient-primary)" }}>
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                </Link>
                <button onClick={() => setMobileOpen(false)} className="lg:hidden absolute right-0 p-2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={toggleCollapsed}
                className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
                title="Expandir menu"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 lg:p-5 flex items-center justify-between shrink-0">
              <Link to="/dashboard" className="flex items-center gap-3 group overflow-hidden">
                <div className="w-9 h-9 rounded-xl grid place-items-center shadow-glow shrink-0 transition-transform group-hover:scale-105" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight animate-in fade-in duration-200 whitespace-nowrap">
                  Verdance
                </span>
              </Link>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleCollapsed}
                  className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
                  title="Recolher menu"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="px-3 flex-1 overflow-y-auto overflow-x-hidden scrollbar-custom space-y-6 pt-2">
            <div className="space-y-1">
              {nav.map((item, index) => {
                const active = pathname === item.to;
                const linkContent = (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center transition-all",
                      collapsed
                        ? "w-10 h-10 mx-auto justify-center rounded-xl"
                        : "gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                      index === 0 && !collapsed && "mt-1",
                      active
                        ? "bg-primary/15 text-primary shadow-glow font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="hidden lg:block font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return linkContent;
              })}
            </div>

            {/* Years Section */}
            <div>
              {!collapsed ? (
                <div className="mb-2 px-3 flex items-center justify-between animate-in fade-in duration-200">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Anos</p>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition" title="Adicionar ano">
                    <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="hidden lg:block border-t border-border/40 my-2 mx-2" />
              )}

              <div className="space-y-1">
                {years?.map(y => {
                  const to = `/year/${y.id}`;
                  const active = pathname === to;
                  const yearContent = (
                    <Link
                      key={y.id}
                      to="/year/$yearId"
                      params={{ yearId: y.id }}
                      className={cn(
                        "flex items-center transition-all group",
                        collapsed
                          ? "w-10 h-10 mx-auto justify-center rounded-xl"
                          : "gap-3 px-3 py-2 rounded-xl text-sm",
                        active ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="whitespace-nowrap">{y.year}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={y.id}>
                        <TooltipTrigger asChild>{yearContent}</TooltipTrigger>
                        <TooltipContent side="right" className="hidden lg:block font-medium">
                          Ano {y.year}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return yearContent;
                })}
                {years?.length === 0 && !collapsed && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Crie seu primeiro ano</p>
                )}
              </div>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border/50 shrink-0">
            {/* User Info */}
            {!collapsed ? (
              <div className="flex items-center gap-3 px-3 py-2 mb-2 animate-in fade-in duration-200">
                <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-semibold shrink-0" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                  {userEmail?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground">Investidor</p>
                </div>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden lg:flex items-center justify-center p-1 mb-2">
                    <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-semibold shrink-0 cursor-pointer" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                      {userEmail?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block font-medium">
                  <p className="font-semibold">{userEmail}</p>
                  <p className="text-[10px] text-primary-foreground/80">Investidor</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Theme Toggle */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={toggle} variant="ghost" size="icon" className="hidden lg:flex w-10 h-10 mx-auto justify-center text-muted-foreground hover:text-foreground mb-1 rounded-xl">
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block font-medium">
                  {theme === "dark" ? "Modo claro" : "Modo escuro"}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={toggle} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground mb-1">
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 mr-2 shrink-0" /> Modo claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2 shrink-0" /> Modo escuro
                  </>
                )}
              </Button>
            )}

            {/* Logout */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleLogout} variant="ghost" size="icon" className="hidden lg:flex w-10 h-10 mx-auto justify-center text-muted-foreground hover:text-destructive rounded-xl">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden lg:block font-medium">
                  Sair
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2 shrink-0" /> Sair
              </Button>
            )}
          </div>
        </aside>

        {mobileOpen && <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="lg:hidden glass border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30 print:hidden">
            <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2">
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">Verdance</span>
            </Link>
            <button onClick={toggle} className="p-2 text-muted-foreground hover:text-foreground shrink-0">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </header>
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}

