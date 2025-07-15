import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from "../store/auth";

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
}

/**
 * Verifica si el token JWT es válido y no ha expirado
 */
export const isValidToken = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    /*
     * El campo `exp` en un JWT estándar está en segundos desde epoch, pero
     * a veces algunas librerías/servicios (o configuraciones custom) lo
     * emiten en milisegundos. Para ser resilientes, normalizamos `exp` a
     * milisegundos antes de compararlo con Date.now().
     */
    const expMs = decoded.exp > 1e12 ? decoded.exp : decoded.exp * 1000; // > 1e12 ≈ milisegundos

    const isValid = expMs > Date.now();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth] isValidToken:', {
        rawExp: decoded.exp,
        expMs,
        now: Date.now(),
        isValid,
      });
    }

    return isValid;
  } catch {
    return false;
  }
};

/**
 * Obtiene el token de acceso del localStorage (solo en cliente)
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('access_token');
};

/**
 * Guarda el token de acceso en localStorage
 */
export const setAccessToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('access_token', token);
};

/**
 * Elimina el token de acceso del localStorage
 */
export const removeAccessToken = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('access_token');
};

/**
 * Verifica si el usuario está autenticado
 * Consulta tanto localStorage como el store de Zustand
 * @returns {boolean} - true si el usuario está autenticado, false en caso contrario
 */
export const isAuthenticated = (): boolean => {
  try {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      console.log('isAuthenticated: Ejecutándose en el servidor, no hay autenticación');
      return false;
    }
    
    // Intentar obtener el token de localStorage primero
    let token = localStorage.getItem('access_token');
    
    // Si no hay token en localStorage, intentar obtenerlo del store de Zustand
    if (!token) {
      token = useAuthStore.getState().accessToken;
      if (token) {
        console.log('isAuthenticated: Token encontrado en Zustand store pero no en localStorage, sincronizando...');
        // Sincronizar localStorage con el store
        localStorage.setItem('access_token', token);
        
        // Sincronizar también el refreshToken si existe
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      }
    } else {
      // Si hay token en localStorage pero no en el store, sincronizar el store
      const storeToken = useAuthStore.getState().accessToken;
      if (!storeToken) {
        console.log('isAuthenticated: Token encontrado en localStorage pero no en Zustand store, sincronizando...');
        // Obtener también el refreshToken si existe
        const refreshToken = localStorage.getItem('refresh_token');
        // Actualizar el store
        useAuthStore.getState().setTokens(token, refreshToken || '');
      }
    }
    
    // Intentar obtener token desde cookies si aún no lo tenemos
    if (!token) {
      const cookieMatch = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
      if (cookieMatch) {
        token = decodeURIComponent(cookieMatch[1]);
        console.log('isAuthenticated: Token cargado desde cookie');
        // Sincronizar LS y store para mantener flujos coherentes
        localStorage.setItem('access_token', token);
      }
    }

    // Si después de intentar recuperar de todas las fuentes no hay token, no está autenticado
    if (!token) {
      console.log('isAuthenticated: No se encontró token en ninguna fuente');
      return false;
    }
    
    // Verificar si el token es válido
    const isValid = isValidToken(token);
    console.log(`isAuthenticated: Token ${isValid ? 'válido' : 'inválido o expirado'}`);
    
    // Si el token no es válido, limpiar tokens
    if (!isValid) {
      console.log('isAuthenticated: Limpiando tokens inválidos');
      useAuthStore.getState().clearTokens();
    }
    
    return isValid;
  } catch (error) {
    console.error('Error en isAuthenticated:', error);
    return false;
  }
};

/**
 * Cierra la sesión del usuario
 */
export const logout = (): void => {
  // Limpiar tokens tanto del store como de localStorage
  useAuthStore.getState().clearTokens();
  
  // Redireccionar al login
  window.location.href = '/login';
};

/**
 * Redirige al usuario a la página de login si no está autenticado
 * @param redirectTo Ruta a la que redirigir después del login
 */
export const requireAuth = (redirectTo?: string): void => {
  if (!isAuthenticated()) {
    const loginPath = redirectTo 
      ? `/login?redirect=${encodeURIComponent(redirectTo)}` 
      : '/login';
    redirect(loginPath);
  }
};

/**
 * Redirige al usuario a la página principal si ya está autenticado
 * @param redirectTo Ruta a la que redirigir si está autenticado
 */
export const requireGuest = (redirectTo: string = '/'): void => {
  if (isAuthenticated()) {
    redirect(redirectTo);
  }
};
