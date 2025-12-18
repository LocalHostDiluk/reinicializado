import type { Timestamp } from "firebase-admin/firestore";

export enum AdjustmentType {
  WASTE_EXPIRED = "waste_expired", // Merma por caducidad
  WASTE_DAMAGED = "waste_damaged", // Merma por daño
  MANUAL_CORRECTION = "manual_correction", // Corrección manual
}

export interface InventoryAdjustment {
  id: string;
  batch_id: string;
  product_id: string; // Denormalizado para consultas
  adjustment_type: AdjustmentType;
  quantity: number; // Cantidad ajustada (siempre negativo o 0 para mermas)
  reason: string;
  adjusted_by: string;
  created_at: Timestamp;
}

export interface CreateInventoryAdjustmentRequest {
  batch_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface InventoryAdjustmentFilters {
  batch_id?: string;
  product_id?: string;
  adjustment_type?: AdjustmentType;
  start_date?: string; // ISO string
  end_date?: string; // ISO string
}

// Para alertas
export interface LowStockAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  min_sale_quantity: number;
  status: "critical" | "warning"; // critical = 0, warning = < min
}

export interface ExpiringProductAlert {
  batch_id: string;
  product_id: string;
  product_name: string;
  current_quantity: number;
  expiration_date: Date;
  days_until_expiration: number;
  status: "expired" | "critical" | "warning"; // expired = pasado, critical = 1-3 días, warning = 4-7 días
}
