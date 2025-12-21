import type { Timestamp } from "firebase-admin/firestore";

export enum PurchaseType {
  DIRECT = "direct", // Compra directa (carne, verduras)
  CONSIGNMENT = "consignment", // Consigna (Sabritas, Coca-Cola)
  SELF_PURCHASE = "self_purchase", // Compra del staff
}

export enum PurchaseStatus {
  PENDING = "pending", // Registrada pero no recibida
  RECEIVED = "received", // Recibida, lotes creados
  COMPLETED = "completed", // Completada (para consigna con devoluciones cerradas)
}

export interface PurchaseItem {
  product_id: string;
  product_name: string; // Denormalizado
  quantity: number;
  unit_cost: number;
  subtotal: number;
  expiration_date?: Date;
  batch_number?: string;
  batch_id?: string; // ID del lote creado (se llena al recibir)
}

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id: string;
  supplier_name: string; // Denormalizado
  purchase_type: PurchaseType;
  status: PurchaseStatus;

  items: PurchaseItem[];

  subtotal: number;
  tax: number;
  total: number;

  purchase_date: Timestamp;
  received_date?: Timestamp;

  invoice_number?: string;
  notes?: string;

  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreatePurchaseRequest {
  supplier_id: string;
  purchase_type: PurchaseType;
  items: CreatePurchaseItemRequest[];
  tax?: number;
  purchase_date?: string; // ISO string, default: hoy
  invoice_number?: string;
  notes?: string;
}

export interface CreatePurchaseItemRequest {
  product_id: string;
  quantity: number;
  unit_cost: number;
  expiration_date?: string; // ISO string
  batch_number?: string;
}

export interface UpdatePurchaseRequest {
  invoice_number?: string;
  notes?: string;
}

export interface PurchaseFilters {
  supplier_id?: string;
  purchase_type?: PurchaseType;
  status?: PurchaseStatus;
  start_date?: string;
  end_date?: string;
}

export interface PurchaseStats {
  total_purchases: number;
  total_amount: number;
  total_items: number;
  by_type: Record<PurchaseType, { count: number; amount: number }>;
  by_status: Record<PurchaseStatus, { count: number; amount: number }>;
}
