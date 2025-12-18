import type { Timestamp } from "firebase-admin/firestore";

// Tipos de venta
export enum SaleType {
  BY_WEIGHT = "by_weight", // Solo por peso
  BY_PIECE = "by_piece", // Solo por pieza (precio fijo)
  BY_WEIGHT_OR_PIECE = "by_weight_or_piece", // Ambos
}

// Producto
export interface Product {
  id: string;
  name: string;
  category_id: string;

  // Configuración de venta
  sale_type: SaleType;
  price_per_kg?: number; // Para BY_WEIGHT y BY_WEIGHT_OR_PIECE
  price_per_piece?: number; // Para BY_PIECE y opcionalmente BY_WEIGHT_OR_PIECE
  calculate_piece_by_weight: boolean; // true = pesar y calcular, false = precio fijo

  // Metadata
  average_weight_per_piece?: number; // Peso promedio cuando se vende por pieza
  min_sale_quantity?: number; // Cantidad mínima de venta (ej: 0.1 kg)

  // Control
  is_active: boolean;
  is_featured: boolean; // Destacado en POS
  image_url?: string; // URL de la imagen

  created_at: Timestamp;
  updated_at: Timestamp;
}

// Request para crear producto
export interface CreateProductRequest {
  name: string;
  category_id: string;
  sale_type: SaleType;
  price_per_kg?: number;
  price_per_piece?: number;
  calculate_piece_by_weight?: boolean;
  average_weight_per_piece?: number;
  min_sale_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
  image_url?: string;
}

// Request para actualizar producto
export interface UpdateProductRequest {
  name?: string;
  category_id?: string;
  sale_type?: SaleType;
  price_per_kg?: number;
  price_per_piece?: number;
  calculate_piece_by_weight?: boolean;
  average_weight_per_piece?: number;
  min_sale_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
  image_url?: string;
}

// Filtros para listar productos
export interface ProductFilters {
  category_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  sale_type?: SaleType;
  search?: string; // Búsqueda por nombre
}
