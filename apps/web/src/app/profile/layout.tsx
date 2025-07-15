"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../lib/auth";
import { useAuthStore } from "../../store/auth";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Asegurarse de que estamos en el cliente
    if (typeof window === 'undefined') return;
    
    // Intentar cargar tokens desde localStorage si no están en el store
    if (!useAuthStore.getState().accessToken) {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('ProfileLayout: Cargando tokens desde localStorage al store');
        useAuthStore.getState().setTokens(accessToken, refreshToken);
      }
    }
    
    // Verificación inmediata para evitar parpadeo
    if (isAuthenticated()) {
      console.log('ProfileLayout: Usuario autenticado inicialmente');
      setIsChecking(false);
      return;
    }
    
    // Segunda verificación con retraso para dar tiempo a la inicialización
    const checkAuth = setTimeout(() => {
      console.log('ProfileLayout: Verificando autenticación con retraso...');
      
      if (!isAuthenticated()) {
        console.log('ProfileLayout: Usuario no autenticado, redirigiendo a login...');
        // Usar window.location para una redirección completa que recargue el estado
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      } else {
        console.log('ProfileLayout: Usuario autenticado después de retraso');
        setIsChecking(false);
      }
    }, 800);
    
    return () => clearTimeout(checkAuth);
  }, [router]);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Perfil de Usuario</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
