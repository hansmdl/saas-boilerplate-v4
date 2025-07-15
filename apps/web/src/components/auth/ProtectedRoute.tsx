"use client";

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// Importación con ruta relativa para compatibilidad con Docker
import { isAuthenticated } from '../../lib/auth';
import { useAuthStore } from '../../store/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege rutas que requieren autenticación
 * Si el usuario no está autenticado, lo redirige a la página de login
 */
export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Asegurarse de que estamos en el cliente
    if (typeof window === 'undefined') return;
    
    // Intentar cargar tokens desde localStorage si no están en el store
    if (!useAuthStore.getState().accessToken) {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('ProtectedRoute: Cargando tokens desde localStorage al store');
        useAuthStore.getState().setTokens(accessToken, refreshToken);
      }
    }
    
    // Verificación inmediata para evitar parpadeo
    if (isAuthenticated()) {
      console.log('ProtectedRoute: Usuario autenticado inicialmente');
      setIsChecking(false);
      return;
    }
    
    // Segunda verificación con retraso para dar tiempo a la inicialización
    const checkAuth = setTimeout(() => {
      console.log('ProtectedRoute: Verificando autenticación con retraso...');
      
      if (!isAuthenticated()) {
        console.log('ProtectedRoute: Usuario no autenticado, redirigiendo a login...');
        // Usar window.location para una redirección completa que recargue el estado
        const encodedRedirect = encodeURIComponent(pathname);
        window.location.href = `${redirectTo}?redirect=${encodedRedirect}`;
      } else {
        console.log('ProtectedRoute: Usuario autenticado después de retraso');
        setIsChecking(false);
      }
    }, 800);
    
    return () => clearTimeout(checkAuth);
  }, [router, pathname, redirectTo]);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
}

/**
 * Componente que protege rutas que requieren que el usuario NO esté autenticado
 * Si el usuario está autenticado, lo redirige a la página especificada
 */
export function GuestRoute({ children, redirectTo = '/dashboard' }: ProtectedRouteProps) {
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
        console.log('GuestRoute: Cargando tokens desde localStorage al store');
        useAuthStore.getState().setTokens(accessToken, refreshToken);
      }
    }
    
    // Verificación inmediata para evitar parpadeo
    if (isAuthenticated()) {
      console.log('GuestRoute: Usuario autenticado inicialmente, redirigiendo...');
      window.location.href = redirectTo;
      return;
    } else {
      console.log('GuestRoute: Usuario no autenticado inicialmente');
      setIsChecking(false);
    }
    
    // Segunda verificación con retraso para dar tiempo a la inicialización
    const checkAuth = setTimeout(() => {
      console.log('GuestRoute: Verificando autenticación con retraso...');
      
      if (isAuthenticated()) {
        console.log('GuestRoute: Usuario autenticado después de retraso, redirigiendo...');
        window.location.href = redirectTo;
      } else {
        console.log('GuestRoute: Usuario no autenticado después de retraso');
        setIsChecking(false);
      }
    }, 800);
    
    return () => clearTimeout(checkAuth);
  }, [router, redirectTo]);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no está autenticado, mostrar el contenido
  return <>{children}</>;
}
