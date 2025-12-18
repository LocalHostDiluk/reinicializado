import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.config.js";
import type { JWTPayload } from "../models/user.model.js";
import { UnauthorizedError } from "./errors.util.js";

/**
 * Genera un Access Token (15 minutos)
 */
export const generateAccessToken = (
  payload: Omit<JWTPayload, "type">
): string => {
  const tokenPayload = {
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    type: "access" as const,
  };

  return jwt.sign(tokenPayload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiry,
  } as jwt.SignOptions);
};

/**
 * Genera un Refresh Token (7 días)
 */
export const generateRefreshToken = (
  payload: Omit<JWTPayload, "type">
): string => {
  const tokenPayload = {
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    type: "refresh" as const,
  };

  return jwt.sign(tokenPayload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
  } as jwt.SignOptions);
};

/**
 * Genera un Manager Temp Token (5 minutos) para operaciones sensibles
 */
export const generateManagerToken = (
  payload: Omit<JWTPayload, "type">,
  operation: string
): string => {
  const tokenPayload = {
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    type: "manager-temp" as const,
    operation,
  };

  return jwt.sign(tokenPayload, jwtConfig.managerTokenSecret, {
    expiresIn: jwtConfig.managerTokenExpiry,
  } as jwt.SignOptions);
};

/**
 * Verifica un Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.accessTokenSecret
    ) as JWTPayload;

    if (decoded.type !== "access") {
      throw new UnauthorizedError("Tipo de token inválido");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Token inválido");
    }
    throw error;
  }
};

/**
 * Verifica un Refresh Token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.refreshTokenSecret
    ) as JWTPayload;

    if (decoded.type !== "refresh") {
      throw new UnauthorizedError("Tipo de token inválido");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Refresh token expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Refresh token inválido");
    }
    throw error;
  }
};

/**
 * Verifica un Manager Temp Token
 */
export const verifyManagerToken = (
  token: string,
  expectedOperation: string
): JWTPayload => {
  try {
    const decoded = jwt.verify(
      token,
      jwtConfig.managerTokenSecret
    ) as JWTPayload & { operation: string };

    if (decoded.type !== "manager-temp") {
      throw new UnauthorizedError("Tipo de token inválido");
    }

    if (decoded.operation !== expectedOperation) {
      throw new UnauthorizedError("Token no autorizado para esta operación");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token de autorización expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Token de autorización inválido");
    }
    throw error;
  }
};
