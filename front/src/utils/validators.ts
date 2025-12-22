/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida longitud mínima de contraseña
 */
export const isValidPassword = (
  password: string,
  minLength: number = 6
): boolean => {
  return password.length >= minLength;
};

/**
 * Valida que un número sea positivo
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === "number" && value > 0;
};
