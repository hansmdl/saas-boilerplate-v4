"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";
import { isValidToken } from "../../lib/auth";

/**
 * Componente que inicializa el estado de autenticación al cargar la aplicación
 * Carga los tokens desde localStorage al store de Zustand y verifica su validez
 */
export default function AuthInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el cliente
    if (typeof window !== 'undefined') {
      console.log('AuthInitializer: Inicializando estado de autenticación...');
      
      // Obtener tokens directamente de localStorage
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('AuthInitializer: Tokens encontrados en localStorage');
        
        // Verificar si el token de acceso es válido
        if (isValidToken(accessToken)) {
          console.log('AuthInitializer: Token de acceso válido, inicializando store');
          // Inicializar el store con los tokens válidos
          useAuthStore.getState().setTokens(accessToken, refreshToken);
        } else {
          console.log('AuthInitializer: Token de acceso inválido, limpiando tokens');
          // Limpiar tokens inválidos
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          useAuthStore.getState().clearTokens();
        }
      } else {
        console.log('AuthInitializer: No se encontraron tokens en localStorage');
      }
      
      // Marcar como inicializado
      setInitialized(true);
      
      console.log('Auth initialized from localStorage');
      console.log('Access token:', localStorage.getItem('access_token') ? 'Present' : 'Not present');
    }
  }, []);

  // Este componente no renderiza nada visible
  return null;
}
