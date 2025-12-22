import { create } from "zustand";
import { authService } from "../services/authService";
import type { User, LoginRequest } from "../types";

interface AuthState {
  // Estado
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  initializeAuth: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  /**
   * Login de usuario
   */
  login: async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);

      // Guardar en localStorage
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Actualizar estado
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /**
   * Logout de usuario
   */
  logout: () => {
    authService.logout();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  /**
   * Actualizar usuario
   */
  setUser: (user: User | null) => {
    set({ user });
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  /**
   * Inicializar autenticación desde localStorage
   */
  initializeAuth: () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userStr = localStorage.getItem("user");

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ isLoading: false });
    }
  },

  /**
   * Verificar si el usuario está autenticado
   */
  checkAuth: async () => {
    const { accessToken } = get();

    if (!accessToken) {
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }

    try {
      const user = await authService.getProfile();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);
      get().logout();
      set({ isLoading: false });
      return false;
    }
  },
}));
