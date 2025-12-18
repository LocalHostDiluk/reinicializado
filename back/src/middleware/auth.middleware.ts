import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { UnauthorizedError } from "../utils/errors.util.js";

/**
 * Middleware para verificar JWT en las peticiones
 * Adjunta los datos del usuario a req.user
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token no proporcionado");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("Token no proporcionado");
    }

    // 2. Verificar token
    const decoded = verifyAccessToken(token);

    // 3. Adjuntar datos del usuario a la request
    (req as any).user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};
