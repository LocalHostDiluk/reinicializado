import type { Timestamp } from "firebase-admin/firestore";
import { SaleType } from "./product.model.js";

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  TRANSFER = "transfer",
  MIXED = "mixed", // ← NUEVO: Pago mixto
}

export interface BatchUsage {
  batch_id: string;
  quantity_used: number;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sale_type: SaleType;
  batches_used: BatchUsage[];
}

// Para pagos mixtos
export interface PaymentBreakdown {
  cash?: number;
  card?: number;
  transfer?: number;
}

export interface Sale {
  id: string;
  sale_number: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_breakdown?: PaymentBreakdown; // ← NUEVO: Solo si es MIXED
  sold_by: string;
  created_at: Timestamp;
}

export interface CreateSaleRequest {
  items: CreateSaleItemRequest[];
  discount?: number;
  payment_method: PaymentMethod;
  payment_breakdown?: PaymentBreakdown; // ← NUEVO: Requerido si payment_method = MIXED
}

export interface CreateSaleItemRequest {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface SaleFilters {
  sold_by?: string;
  payment_method?: PaymentMethod;
  start_date?: string;
  end_date?: string;
}

// Movimiento de inventario por venta
export interface SaleInventoryMovement {
  id: string;
  sale_id: string;
  batch_id: string;
  product_id: string;
  quantity: number;
  created_at: Timestamp;
}

// Estadísticas
export interface SalesStats {
  total_sales: number;
  total_amount: number;
  total_items_sold: number;
  payment_methods: Record<PaymentMethod, { count: number; amount: number }>;
}
