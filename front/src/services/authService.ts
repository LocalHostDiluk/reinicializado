import { api } from "../lib/axios";
import type {
  LoginRequest,
  AuthResponse,
  VerifyManagerRequest,
  VerifyManagerResponse,
  User,
  ApiResponse,
} from "../types";

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Login de usuario
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    return data.data!;
  },

  /**
   * Refresh de tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/refresh",
      {
        refreshToken,
      }
    );
    return data.data!;
  },

  /**
   * Verificar credenciales de gerente
   */
  async verifyManager(
    credentials: VerifyManagerRequest
  ): Promise<VerifyManagerResponse> {
    const { data } = await api.post<ApiResponse<VerifyManagerResponse>>(
      "/auth/verify-manager",
      credentials
    );
    return data.data!;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>("/auth/profile");
    return data.data!;
  },

  /**
   * Logout (limpia tokens del localStorage)
   */
  logout(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};
