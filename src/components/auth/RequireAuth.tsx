"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SetupGuide } from "@/components/setup/SetupGuide";

/** Protege una página: redirige a la portada si no hay sesión iniciada. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) router.replace("/");
  }, [configured, loading, user, router]);

  if (!configured) return <SetupGuide />;
  if (loading || !user) {
    return <p className="text-center italic mt-16 text-muted-brown">Abriendo el grimorio…</p>;
  }
  return <>{children}</>;
}
