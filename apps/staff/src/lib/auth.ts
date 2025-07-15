import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/auth";

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

/**
 * Verifica si el token JWT es válido y no ha expirado
 */
export const isValidToken = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const expMs = decoded.exp > 1e12 ? decoded.exp : decoded.exp * 1000; // normalizar
    return expMs > Date.now();
  } catch {
    return false;
  }
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const setTokens = (access: string, refresh: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  useAuthStore.getState().setTokens(access, refresh);
};

export const clearTokens = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
  useAuthStore.getState().clearTokens();
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  let token = getAccessToken();
  if (!token) {
    token = useAuthStore.getState().accessToken || null;
  }
  if (!token) return false;
  return isValidToken(token);
};

export const logout = (): void => {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
