import { SaleType } from "../models/product.model.js";
import { BadRequestError } from "./errors.util.js";

/**
 * Valida la configuración de precios de un producto según su tipo de venta
 */
export const validateProductPricing = (data: {
  sale_type: SaleType;
  price_per_kg?: number | null;
  price_per_piece?: number | null;
  calculate_piece_by_weight?: boolean;
}): void => {
  const {
    sale_type,
    price_per_kg,
    price_per_piece,
    calculate_piece_by_weight,
  } = data;

  // Validar BY_WEIGHT
  if (sale_type === SaleType.BY_WEIGHT) {
    if (!price_per_kg || price_per_kg <= 0) {
      throw new BadRequestError(
        "Productos por peso deben tener price_per_kg mayor a 0"
      );
    }

    if (price_per_piece) {
      throw new BadRequestError(
        "Productos por peso no deben tener price_per_piece"
      );
    }
  }

  // Validar BY_PIECE
  if (sale_type === SaleType.BY_PIECE) {
    if (!price_per_piece || price_per_piece <= 0) {
      throw new BadRequestError(
        "Productos por pieza deben tener price_per_piece mayor a 0"
      );
    }

    if (price_per_kg) {
      throw new BadRequestError(
        "Productos por pieza no deben tener price_per_kg"
      );
    }
  }

  // Validar BY_WEIGHT_OR_PIECE
  if (sale_type === SaleType.BY_WEIGHT_OR_PIECE) {
    if (!price_per_kg || price_per_kg <= 0) {
      throw new BadRequestError(
        "Productos mixtos deben tener price_per_kg mayor a 0"
      );
    }

    // Si NO se calcula por peso, debe tener precio fijo por pieza
    if (calculate_piece_by_weight === false) {
      if (!price_per_piece || price_per_piece <= 0) {
        throw new BadRequestError(
          "Productos mixtos con precio fijo deben tener price_per_piece mayor a 0"
        );
      }
    }

    // Si SÍ se calcula por peso, NO debe tener precio por pieza
    if (calculate_piece_by_weight === true && price_per_piece) {
      throw new BadRequestError(
        "Productos mixtos calculados por peso no deben tener price_per_piece"
      );
    }
  }
};

/**
 * Valida que los precios sean números válidos
 */
export const validatePriceValues = (
  prices: Record<string, number | undefined>
): void => {
  for (const [key, value] of Object.entries(prices)) {
    if (value !== undefined) {
      if (typeof value !== "number" || isNaN(value) || value < 0) {
        throw new BadRequestError(
          `${key} debe ser un número válido mayor o igual a 0`
        );
      }
    }
  }
};
