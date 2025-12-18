import { db } from "../config/firebase.js";
import type {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierFilters,
} from "../models/supplier.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import type { PaginatedResponse } from "../utils/pagination.util.js";
import {
  calculatePagination,
  normalizePagination,
} from "../utils/pagination.util.js";
import { FieldValue } from "firebase-admin/firestore";

export class SupplierService {
  private suppliersCollection = db.collection("suppliers");

  /**
   * Crear proveedor
   */
  async create(data: CreateSupplierRequest): Promise<Supplier> {
    validateRequiredFields(data, ["name"]);

    // Verificar que no exista un proveedor con el mismo nombre
    const existingSupplier = await this.suppliersCollection
      .where("name", "==", data.name.trim())
      .limit(1)
      .get();

    if (!existingSupplier.empty) {
      throw new BadRequestError("Ya existe un proveedor con ese nombre");
    }

    // Validar email si se proporciona
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestError("Email inválido");
      }
    }

    const supplierRef = this.suppliersCollection.doc();
    const now = FieldValue.serverTimestamp();

    const supplier = {
      id: supplierRef.id,
      name: data.name.trim(),
      contact_name: data.contact_name?.trim() ?? null,
      phone: data.phone?.trim() ?? null,
      email: data.email?.trim() ?? null,
      address: data.address?.trim() ?? null,
      notes: data.notes?.trim() ?? null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await supplierRef.set(supplier);

    const createdDoc = await supplierRef.get();
    return createdDoc.data() as Supplier;
  }

  /**
   * Listar proveedores con filtros y paginación
   */
  async getAll(
    filters: SupplierFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Supplier>> {
    const { page, limit } = normalizePagination(paginationParams);

    // Obtener todos los proveedores
    const snapshot = await this.suppliersCollection
      .orderBy("name", "asc")
      .get();

    let allSuppliers = snapshot.docs.map((doc) => doc.data() as Supplier);

    // Aplicar filtros en memoria
    if (filters.is_active !== undefined) {
      allSuppliers = allSuppliers.filter(
        (s) => s.is_active === filters.is_active
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      allSuppliers = allSuppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.contact_name?.toLowerCase().includes(searchLower)
      );
    }

    const total = allSuppliers.length;

    // Aplicar paginación en memoria
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSuppliers = allSuppliers.slice(startIndex, endIndex);

    return {
      data: paginatedSuppliers,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener proveedor por ID
   */
  async getById(id: string): Promise<Supplier> {
    const doc = await this.suppliersCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    return doc.data() as Supplier;
  }

  /**
   * Actualizar proveedor
   */
  async update(id: string, data: UpdateSupplierRequest): Promise<Supplier> {
    const supplierDoc = await this.suppliersCollection.doc(id).get();

    if (!supplierDoc.exists) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    const currentSupplier = supplierDoc.data() as Supplier;

    // Si se actualiza el nombre, verificar que no exista otro con ese nombre
    if (data.name && data.name.trim() !== currentSupplier.name) {
      const existingSnapshot = await this.suppliersCollection
        .where("name", "==", data.name.trim())
        .limit(1)
        .get();

      if (!existingSnapshot.empty && existingSnapshot.docs[0]?.id !== id) {
        throw new BadRequestError("Ya existe otro proveedor con ese nombre");
      }
    }

    // Validar email si se proporciona
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestError("Email inválido");
      }
    }

    const updates: Record<string, any> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (data.name) updates.name = data.name.trim();
    if (data.contact_name !== undefined)
      updates.contact_name = data.contact_name?.trim() ?? null;
    if (data.phone !== undefined) updates.phone = data.phone?.trim() ?? null;
    if (data.email !== undefined) updates.email = data.email?.trim() ?? null;
    if (data.address !== undefined)
      updates.address = data.address?.trim() ?? null;
    if (data.notes !== undefined) updates.notes = data.notes?.trim() ?? null;
    if (data.is_active !== undefined) updates.is_active = data.is_active;

    await this.suppliersCollection.doc(id).update(updates);

    const updatedDoc = await this.suppliersCollection.doc(id).get();
    return updatedDoc.data() as Supplier;
  }

  /**
   * Eliminar proveedor (soft delete)
   */
  async delete(id: string): Promise<void> {
    const supplierDoc = await this.suppliersCollection.doc(id).get();

    if (!supplierDoc.exists) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    // Verificar que no haya lotes asociados (verificaremos esto cuando hagamos el módulo de lotes)
    // Por ahora solo hacemos soft delete

    await this.suppliersCollection.doc(id).update({
      is_active: false,
      updated_at: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Toggle proveedor activo/inactivo
   */
  async toggleActive(id: string): Promise<Supplier> {
    const supplierDoc = await this.suppliersCollection.doc(id).get();

    if (!supplierDoc.exists) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    const supplier = supplierDoc.data() as Supplier;

    await this.suppliersCollection.doc(id).update({
      is_active: !supplier.is_active,
      updated_at: FieldValue.serverTimestamp(),
    });

    const updatedDoc = await this.suppliersCollection.doc(id).get();
    return updatedDoc.data() as Supplier;
  }
}
