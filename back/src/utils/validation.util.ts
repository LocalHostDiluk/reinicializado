import { BadRequestError } from "./errors.util.js";

/**
 * Valida formato de email
 */
export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError("Formato de email inválido");
  }
};

/**
 * Valida longitud de contraseña
 */
export const validatePassword = (password: string): void => {
  if (password.length < 6) {
    throw new BadRequestError("La contraseña debe tener al menos 6 caracteres");
  }
};

/**
 * Valida que los campos requeridos existan
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): void => {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new BadRequestError(
      `Campos requeridos faltantes: ${missingFields.join(", ")}`
    );
  }
};
