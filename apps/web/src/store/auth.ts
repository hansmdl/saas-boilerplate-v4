import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  initializeFromStorage: () => void;
}

// Función para obtener tokens desde localStorage (solo en cliente)
const getTokensFromStorage = () => {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token')
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  // Inicializar con null, se cargará desde localStorage en el cliente
  accessToken: null,
  refreshToken: null,
  
  // Guardar tokens en el estado y localStorage
  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
    set({ accessToken, refreshToken });
  },
  
  // Limpiar tokens del estado y localStorage
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    set({ accessToken: null, refreshToken: null });
  },
  
  // Cargar tokens desde localStorage al inicializar
  initializeFromStorage: () => {
    const { accessToken, refreshToken } = getTokensFromStorage();
    set({ accessToken, refreshToken });
  }
}));
