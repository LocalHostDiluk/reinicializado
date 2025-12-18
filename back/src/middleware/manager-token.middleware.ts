import type { Request, Response, NextFunction } from "express";
import { verifyManagerToken } from "../utils/jwt.util.js";
import { UnauthorizedError } from "../utils/errors.util.js";

/**
 * Middleware para verificar token temporal de gerente en operaciones sensibles
 */
export const requireManagerToken = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 1. Obtener token del header X-Manager-Token
      const managerToken = req.headers["x-manager-token"] as string;

      if (!managerToken) {
        throw new UnauthorizedError(
          "Esta operación requiere autorización de gerente. Token no proporcionado"
        );
      }

      // 2. Verificar token y operación
      const decoded = verifyManagerToken(managerToken, operation);

      // 3. Adjuntar datos del gerente autorizador a la request
      (req as any).authorizedBy = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
