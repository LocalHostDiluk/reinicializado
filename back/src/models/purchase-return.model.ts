import type { Timestamp } from "firebase-admin/firestore";

export enum ReturnReason {
  DAMAGED = "damaged",
  EXPIRED = "expired",
  EXCHANGE = "exchange",
  OTHER = "other",
}

export enum ReturnType {
  REFUND = "refund",
  EXCHANGE = "exchange",
  CREDIT = "credit",
}

export interface PurchaseReturnItem {
  product_id: string;
  product_name: string;
  batch_id: string;
  quantity_returned: number;
  unit_cost: number;
  subtotal: number;
  reason: ReturnReason;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  return_number: string;
  purchase_id: string;
  purchase_number: string; // Denormalizado
  supplier_id: string;
  supplier_name: string; // Denormalizado

  items: PurchaseReturnItem[];

  return_type: ReturnType;
  total_refund: number;

  return_date: Timestamp;
  created_by: string;
  created_at: Timestamp;
}

export interface CreatePurchaseReturnRequest {
  purchase_id: string;
  items: CreatePurchaseReturnItemRequest[];
  return_type: ReturnType;
  return_date?: string; // ISO string, default: hoy
}

export interface CreatePurchaseReturnItemRequest {
  batch_id: string;
  quantity_returned: number;
  reason: ReturnReason;
  notes?: string;
}

export interface PurchaseReturnFilters {
  purchase_id?: string;
  supplier_id?: string;
  return_type?: ReturnType;
  start_date?: string;
  end_date?: string;
}
