import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea un número como moneda (pesos mexicanos)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

/**
 * Formatea una fecha
 */
export const formatDate = (
  date: Date | string,
  formatStr: string = "dd/MM/yyyy"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: es });
};

/**
 * Formatea fecha y hora
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, "dd/MM/yyyy HH:mm");
};

/**
 * Formatea peso (kg)
 */
export const formatWeight = (kg: number): string => {
  return `${kg.toFixed(2)} kg`;
};
