import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getAuth(getApp());
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate({ to: "/auth" });
      else setReady(true);
    });
  }, [navigate]);

  if (!ready) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
