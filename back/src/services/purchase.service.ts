import { db } from "../config/firebase.js";
import type {
  Purchase,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  PurchaseFilters,
  PurchaseStats,
  PurchaseItem,
} from "../models/purchase.model.js";
import { PurchaseType, PurchaseStatus } from "../models/purchase.model.js";
import type { InventoryBatch } from "../models/inventory-batch.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import type { PaginatedResponse } from "../utils/pagination.util.js";
import {
  calculatePagination,
  normalizePagination,
} from "../utils/pagination.util.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export class PurchaseService {
  private purchasesCollection = db.collection("purchases");
  private suppliersCollection = db.collection("suppliers");
  private productsCollection = db.collection("products");
  private batchesCollection = db.collection("inventory_batches");

  /**
   * Crear compra
   */
  async create(data: CreatePurchaseRequest, userId: string): Promise<Purchase> {
    validateRequiredFields(data, ["supplier_id", "purchase_type", "items"]);

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError("La compra debe tener al menos un producto");
    }

    // Verificar que el proveedor exista
    const supplierDoc = await this.suppliersCollection
      .doc(data.supplier_id)
      .get();
    if (!supplierDoc.exists) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    const supplier = supplierDoc.data();
    if (!supplier) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    // Procesar items y validar productos
    const processedItems: PurchaseItem[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      validateRequiredFields(item, ["product_id", "quantity", "unit_cost"]);

      if (item.quantity <= 0) {
        throw new BadRequestError("La cantidad debe ser mayor a 0");
      }

      if (item.unit_cost < 0) {
        throw new BadRequestError("El costo unitario no puede ser negativo");
      }

      // Obtener producto
      const productDoc = await this.productsCollection
        .doc(item.product_id)
        .get();
      if (!productDoc.exists) {
        throw new NotFoundError(`Producto ${item.product_id} no encontrado`);
      }

      const product = productDoc.data();
      if (!product) {
        throw new NotFoundError(`Producto ${item.product_id} no encontrado`);
      }

      // Validar fecha de caducidad si se proporciona
      let expirationDate: Date | undefined;
      if (item.expiration_date) {
        expirationDate = new Date(item.expiration_date);
        if (isNaN(expirationDate.getTime())) {
          throw new BadRequestError("Fecha de caducidad inválida");
        }
        // Validar que no esté caducada
        if (expirationDate < new Date()) {
          throw new BadRequestError(
            `La fecha de caducidad de ${product.name} ya pasó`
          );
        }
      }

      const itemSubtotal = item.quantity * item.unit_cost;
      subtotal += itemSubtotal;

      const purchaseItem: any = {
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        subtotal: itemSubtotal,
      };

      // Solo agregar campos opcionales si existen
      if (expirationDate) {
        purchaseItem.expiration_date = expirationDate;
      }

      if (item.batch_number) {
        purchaseItem.batch_number = item.batch_number;
      }

      processedItems.push(purchaseItem as PurchaseItem);
    }

    // Calcular totales
    const tax = data.tax && data.tax >= 0 ? data.tax : 0;
    const total = subtotal + tax;

    // Generar número de compra
    const purchaseNumber = await this.generatePurchaseNumber();

    // Fecha de compra
    let purchaseDate: Date;
    if (data.purchase_date) {
      purchaseDate = new Date(data.purchase_date);
      if (isNaN(purchaseDate.getTime())) {
        throw new BadRequestError("Fecha de compra inválida");
      }
    } else {
      purchaseDate = new Date();
    }

    const purchaseRef = this.purchasesCollection.doc();
    const now = FieldValue.serverTimestamp();

    const purchase = {
      id: purchaseRef.id,
      purchase_number: purchaseNumber,
      supplier_id: data.supplier_id,
      supplier_name: supplier.name,
      purchase_type: data.purchase_type,
      status: PurchaseStatus.PENDING,
      items: processedItems,
      subtotal,
      tax,
      total,
      purchase_date: Timestamp.fromDate(purchaseDate),
      invoice_number: data.invoice_number?.trim() ?? null,
      notes: data.notes?.trim() ?? null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    await purchaseRef.set(purchase);

    const createdDoc = await purchaseRef.get();
    return createdDoc.data() as Purchase;
  }

  /**
   * Generar número de compra único (COMPRA-YYYYMMDD-XXXX)
   */
  private async generatePurchaseNumber(): Promise<string> {
    const today = new Date();
    const isoDate = today.toISOString().split("T")[0];
    if (!isoDate) {
      throw new Error("Error generando número de compra");
    }
    const dateStr = isoDate.replace(/-/g, "");

    // Contar compras del día
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayPurchasesSnapshot = await this.purchasesCollection
      .where("created_at", ">=", Timestamp.fromDate(startOfDay))
      .where("created_at", "<=", Timestamp.fromDate(endOfDay))
      .get();

    const count = todayPurchasesSnapshot.size + 1;
    const paddedCount = count.toString().padStart(4, "0");

    return `COMPRA-${dateStr}-${paddedCount}`;
  }

  /**
   * Marcar compra como recibida (crea lotes automáticamente)
   */
  async markAsReceived(id: string, userId: string): Promise<Purchase> {
    const purchaseDoc = await this.purchasesCollection.doc(id).get();

    if (!purchaseDoc.exists) {
      throw new NotFoundError("Compra no encontrada");
    }

    const purchase = purchaseDoc.data() as Purchase;

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestError(
        `La compra ya fue procesada (estado: ${purchase.status})`
      );
    }

    // Usar transacción para crear lotes y actualizar compra
    await db.runTransaction(async (transaction) => {
      const updatedItems: PurchaseItem[] = [];

      // Crear lote para cada item
      for (const item of purchase.items) {
        const batchRef = this.batchesCollection.doc();
        const now = FieldValue.serverTimestamp();

        // Generar número de lote si no tiene
        const batchNumber =
          item.batch_number ||
          `${purchase.purchase_number}-${item.product_id.substring(0, 6)}`;

        const batch: Omit<InventoryBatch, "id"> = {
          product_id: item.product_id,
          supplier_id: purchase.supplier_id,
          batch_number: batchNumber,
          initial_quantity: item.quantity,
          current_quantity: item.quantity,
          purchase_price: item.unit_cost,
          entry_date: purchase.purchase_date,
          expiration_date: item.expiration_date
            ? Timestamp.fromDate(item.expiration_date)
            : (undefined as any),
          notes: `Compra: ${purchase.purchase_number}`,
          created_by: userId,
          created_at: now as any,
          updated_at: now as any,
        };

        transaction.set(batchRef, { ...batch, id: batchRef.id });

        // Actualizar item con batch_id
        updatedItems.push({
          ...item,
          batch_id: batchRef.id,
        });
      }

      // Actualizar compra
      transaction.update(this.purchasesCollection.doc(id), {
        items: updatedItems,
        status: PurchaseStatus.RECEIVED,
        received_date: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    // Obtener compra actualizada
    const updatedDoc = await this.purchasesCollection.doc(id).get();
    return updatedDoc.data() as Purchase;
  }

  /**
   * Listar compras con filtros y paginación
   */
  async getAll(
    filters: PurchaseFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Purchase>> {
    const { page, limit } = normalizePagination(paginationParams);

    let query: FirebaseFirestore.Query = this.purchasesCollection;

    // Aplicar filtros
    if (filters.supplier_id) {
      query = query.where("supplier_id", "==", filters.supplier_id);
    }

    if (filters.purchase_type) {
      query = query.where("purchase_type", "==", filters.purchase_type);
    }

    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }

    // Ordenar por fecha (más recientes primero)
    query = query.orderBy("purchase_date", "desc");

    // Obtener documentos
    const snapshot = await query.get();
    let allPurchases = snapshot.docs.map((doc) => doc.data() as Purchase);

    // Filtrar por rango de fechas en memoria
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      allPurchases = allPurchases.filter((purchase) => {
        const purchaseDate = (purchase.purchase_date as any).toDate();
        if (startDate && purchaseDate < startDate) return false;
        if (endDate && purchaseDate > endDate) return false;
        return true;
      });
    }

    const total = allPurchases.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPurchases = allPurchases.slice(startIndex, endIndex);

    return {
      data: paginatedPurchases,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener compra por ID
   */
  async getById(id: string): Promise<Purchase> {
    const doc = await this.purchasesCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Compra no encontrada");
    }

    return doc.data() as Purchase;
  }

  /**
   * Actualizar compra (solo campos editables)
   */
  async update(id: string, data: UpdatePurchaseRequest): Promise<Purchase> {
    const purchaseDoc = await this.purchasesCollection.doc(id).get();

    if (!purchaseDoc.exists) {
      throw new NotFoundError("Compra no encontrada");
    }

    const purchase = purchaseDoc.data() as Purchase;

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestError("Solo se pueden editar compras pendientes");
    }

    const updates: Record<string, any> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (data.invoice_number !== undefined) {
      updates.invoice_number = data.invoice_number?.trim() ?? null;
    }

    if (data.notes !== undefined) {
      updates.notes = data.notes?.trim() ?? null;
    }

    await this.purchasesCollection.doc(id).update(updates);

    const updatedDoc = await this.purchasesCollection.doc(id).get();
    return updatedDoc.data() as Purchase;
  }

  /**
   * Cancelar compra
   */
  async cancel(id: string): Promise<void> {
    const purchaseDoc = await this.purchasesCollection.doc(id).get();

    if (!purchaseDoc.exists) {
      throw new NotFoundError("Compra no encontrada");
    }

    const purchase = purchaseDoc.data() as Purchase;

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestError("Solo se pueden cancelar compras pendientes");
    }

    await this.purchasesCollection.doc(id).delete();
  }

  /**
   * Obtener estadísticas de compras
   */
  async getStats(
    filters: {
      start_date?: string;
      end_date?: string;
      supplier_id?: string;
    } = {}
  ): Promise<PurchaseStats> {
    let query: FirebaseFirestore.Query = this.purchasesCollection;

    if (filters.supplier_id) {
      query = query.where("supplier_id", "==", filters.supplier_id);
    }

    const snapshot = await query.get();
    let purchases = snapshot.docs.map((doc) => doc.data() as Purchase);

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      purchases = purchases.filter((purchase) => {
        const purchaseDate = (purchase.purchase_date as any).toDate();
        if (startDate && purchaseDate < startDate) return false;
        if (endDate && purchaseDate > endDate) return false;
        return true;
      });
    }

    // Calcular estadísticas
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce(
      (sum, purchase) => sum + purchase.total,
      0
    );
    const totalItems = purchases.reduce((sum, purchase) => {
      return (
        sum +
        purchase.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      );
    }, 0);

    // Por tipo de compra
    const byType: Record<PurchaseType, { count: number; amount: number }> = {
      [PurchaseType.DIRECT]: { count: 0, amount: 0 },
      [PurchaseType.CONSIGNMENT]: { count: 0, amount: 0 },
      [PurchaseType.SELF_PURCHASE]: { count: 0, amount: 0 },
    };

    // Por estado
    const byStatus: Record<PurchaseStatus, { count: number; amount: number }> =
      {
        [PurchaseStatus.PENDING]: { count: 0, amount: 0 },
        [PurchaseStatus.RECEIVED]: { count: 0, amount: 0 },
        [PurchaseStatus.COMPLETED]: { count: 0, amount: 0 },
      };

    purchases.forEach((purchase) => {
      byType[purchase.purchase_type].count++;
      byType[purchase.purchase_type].amount += purchase.total;

      byStatus[purchase.status].count++;
      byStatus[purchase.status].amount += purchase.total;
    });

    return {
      total_purchases: totalPurchases,
      total_amount: totalAmount,
      total_items: totalItems,
      by_type: byType,
      by_status: byStatus,
    };
  }
}
