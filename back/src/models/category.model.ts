import type { Timestamp } from "firebase-admin/firestore";

export interface Category {
  id: string;
  name: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
}
