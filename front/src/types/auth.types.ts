// Roles del usuario (usando const object en lugar de enum)
export const UserRole = {
  GERENTE: "gerente",
  CAJERO: "cajero",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Usuario
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

// Request de login
export interface LoginRequest {
  email: string;
  password: string;
}

// Response de login/refresh
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Request de verificación de gerente
export interface VerifyManagerRequest {
  email: string;
  password: string;
  operation: string;
}

// Response de verificación de gerente
export interface VerifyManagerResponse {
  managerToken: string;
}
