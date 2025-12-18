// Enum de roles
export enum UserRole {
  GERENTE = "gerente",
  CAJERO = "cajero",
}

// Interface de Usuario en Firestore
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Payload del JWT
export interface JWTPayload {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  type: "access" | "refresh" | "manager-temp"; // Tipo de token
}

// Datos que retornamos al frontend
export interface AuthResponse {
  user: {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

// Request de login
export interface LoginRequest {
  email: string;
  password: string;
}

// Request de verificación de gerente
export interface VerifyManagerRequest {
  email: string;
  password: string;
  operation: string; // Ej: "CLOSE_CASH_DRAWER", "DELETE_SALE"
}
