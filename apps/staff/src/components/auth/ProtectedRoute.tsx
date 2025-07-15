"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "../../lib/auth";
import { useAuthStore } from "../../store/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Protege rutas que necesitan autenticación staff
 */
export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sincronizar tokens del localStorage al store si hace falta
    if (!useAuthStore.getState().accessToken) {
      const access = localStorage.getItem("access_token");
      const refresh = localStorage.getItem("refresh_token");
      if (access && refresh) {
        useAuthStore.getState().setTokens(access, refresh);
      }
    }

    if (!isAuthenticated()) {
      const encoded = encodeURIComponent(pathname);
      router.push(`${redirectTo}?redirect=${encoded}`);
    } else {
      setChecking(false);
    }
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Solo permite acceso si el usuario NO está autenticado
 */
export function GuestRoute({ children, redirectTo = "/" }: ProtectedRouteProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isAuthenticated()) {
      router.push(redirectTo);
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
