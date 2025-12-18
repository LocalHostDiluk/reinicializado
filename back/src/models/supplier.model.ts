import type { Timestamp } from "firebase-admin/firestore";

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateSupplierRequest {
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
  notes?: string;
}

export interface SupplierFilters {
  is_active?: boolean;
  search?: string; // Búsqueda por nombre
}
