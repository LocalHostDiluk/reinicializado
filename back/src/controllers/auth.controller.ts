import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import type {
  LoginRequest,
  VerifyManagerRequest,
} from "../models/user.model.js";

const authService = new AuthService();

/**
 * POST /auth/login
 * Login de usuario
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const loginData: LoginRequest = req.body;
    const result = await authService.login(loginData);

    res.status(200).json({
      status: "success",
      message: "Login exitoso",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Renovar tokens usando refresh token
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        status: "error",
        message: "Refresh token requerido",
      });
      return;
    }

    const result = await authService.refreshTokens(refreshToken);

    res.status(200).json({
      status: "success",
      message: "Tokens renovados exitosamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/verify-manager
 * Verificar credenciales de gerente para operaciones sensibles
 */
export const verifyManager = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifyData: VerifyManagerRequest = req.body;
    const result = await authService.verifyManager(verifyData);

    res.status(200).json({
      status: "success",
      message: "Autorización de gerente concedida",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/profile
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // El uid viene del middleware de autenticación (req.user)
    const uid = (req as any).user?.uid;

    if (!uid) {
      res.status(401).json({
        status: "error",
        message: "No autenticado",
      });
      return;
    }

    const profile = await authService.getProfile(uid);

    res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
