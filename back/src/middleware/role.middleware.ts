import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/user.model.js";
import { ForbiddenError } from "../utils/errors.util.js";

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new ForbiddenError("Usuario no autenticado");
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenError(
          `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(
            ", "
          )}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware específico para verificar que sea gerente
 */
export const requireManager = requireRole([UserRole.GERENTE]);

/**
 * Middleware que permite tanto gerente como cajero (autenticación básica)
 */
export const requireAuth = requireRole([UserRole.GERENTE, UserRole.CAJERO]);
