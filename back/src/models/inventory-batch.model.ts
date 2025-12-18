import type { Timestamp } from "firebase-admin/firestore";

export interface InventoryBatch {
  id: string;
  product_id: string;
  supplier_id: string;
  batch_number?: string;
  initial_quantity: number;
  current_quantity: number;
  purchase_price: number;
  entry_date: Timestamp;
  expiration_date?: Timestamp;
  notes?: string;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateInventoryBatchRequest {
  product_id: string;
  supplier_id: string;
  batch_number?: string;
  initial_quantity: number;
  purchase_price: number;
  entry_date?: string; // ISO string, si no se proporciona se usa la fecha actual
  expiration_date?: string; // ISO string
  notes?: string;
}

export interface UpdateInventoryBatchRequest {
  batch_number?: string;
  expiration_date?: string;
  notes?: string;
}

export interface InventoryBatchFilters {
  product_id?: string;
  supplier_id?: string;
  has_stock?: boolean; // true = current_quantity > 0
  expiring_in_days?: number; // Filtrar lotes que caducan en X días
}

// Para consultar stock actual de un producto
export interface ProductStock {
  product_id: string;
  total_quantity: number;
  batches_count: number;
  oldest_batch_date?: Date;
  nearest_expiration_date?: Date;
}
