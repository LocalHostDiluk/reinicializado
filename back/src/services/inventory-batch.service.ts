import { db } from "../config/firebase.js";
import type {
  InventoryBatch,
  CreateInventoryBatchRequest,
  UpdateInventoryBatchRequest,
  InventoryBatchFilters,
  ProductStock,
} from "../models/inventory-batch.model.js";
import type {
  LowStockAlert,
  ExpiringProductAlert,
} from "../models/inventory-adjustment.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import type { PaginatedResponse } from "../utils/pagination.util.js";
import {
  calculatePagination,
  normalizePagination,
} from "../utils/pagination.util.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export class InventoryBatchService {
  private batchesCollection = db.collection("inventory_batches");
  private productsCollection = db.collection("products");
  private suppliersCollection = db.collection("suppliers");

  /**
   * Crear lote (entrada de mercancía)
   */
  async create(
    data: CreateInventoryBatchRequest,
    userId: string
  ): Promise<InventoryBatch> {
    validateRequiredFields(data, [
      "product_id",
      "supplier_id",
      "initial_quantity",
      "purchase_price",
    ]);

    // Validar que la cantidad sea positiva
    if (data.initial_quantity <= 0) {
      throw new BadRequestError("La cantidad inicial debe ser mayor a 0");
    }

    if (data.purchase_price < 0) {
      throw new BadRequestError("El precio de compra no puede ser negativo");
    }

    // Verificar que el producto exista
    const productDoc = await this.productsCollection.doc(data.product_id).get();
    if (!productDoc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    // Verificar que el proveedor exista
    const supplierDoc = await this.suppliersCollection
      .doc(data.supplier_id)
      .get();
    if (!supplierDoc.exists) {
      throw new NotFoundError("Proveedor no encontrado");
    }

    // Parsear fechas
    let entryDate: any = FieldValue.serverTimestamp();
    if (data.entry_date) {
      const parsedDate = new Date(data.entry_date);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestError("Fecha de entrada inválida");
      }
      entryDate = Timestamp.fromDate(parsedDate);
    }

    let expirationDate: any = null;
    if (data.expiration_date) {
      const parsedDate = new Date(data.expiration_date);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestError("Fecha de caducidad inválida");
      }
      expirationDate = Timestamp.fromDate(parsedDate);
    }

    const batchRef = this.batchesCollection.doc();
    const now = FieldValue.serverTimestamp();

    const batch = {
      id: batchRef.id,
      product_id: data.product_id,
      supplier_id: data.supplier_id,
      batch_number: data.batch_number?.trim() ?? null,
      initial_quantity: data.initial_quantity,
      current_quantity: data.initial_quantity, // Al inicio, cantidad actual = inicial
      purchase_price: data.purchase_price,
      entry_date: entryDate,
      expiration_date: expirationDate,
      notes: data.notes?.trim() ?? null,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    await batchRef.set(batch);

    const createdDoc = await batchRef.get();
    return createdDoc.data() as InventoryBatch;
  }

  /**
   * Listar lotes con filtros y paginación
   */
  async getAll(
    filters: InventoryBatchFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<InventoryBatch>> {
    const { page, limit } = normalizePagination(paginationParams);

    let query: FirebaseFirestore.Query = this.batchesCollection;

    // Aplicar filtros
    if (filters.product_id) {
      query = query.where("product_id", "==", filters.product_id);
    }

    if (filters.supplier_id) {
      query = query.where("supplier_id", "==", filters.supplier_id);
    }

    // Ordenar por fecha de entrada (más recientes primero)
    query = query.orderBy("entry_date", "desc");

    // Obtener todos los documentos
    const snapshot = await query.get();
    let allBatches = snapshot.docs.map((doc) => doc.data() as InventoryBatch);

    // Filtrar por stock en memoria
    if (filters.has_stock !== undefined) {
      if (filters.has_stock) {
        allBatches = allBatches.filter((b) => b.current_quantity > 0);
      } else {
        allBatches = allBatches.filter((b) => b.current_quantity === 0);
      }
    }

    // Filtrar por próximos a caducar
    if (filters.expiring_in_days !== undefined) {
      const now = new Date();
      const daysInMs = filters.expiring_in_days * 24 * 60 * 60 * 1000;
      const futureDate = new Date(now.getTime() + daysInMs);

      allBatches = allBatches.filter((b) => {
        if (!b.expiration_date) return false;
        const expDate = (b.expiration_date as any).toDate();
        return expDate >= now && expDate <= futureDate;
      });
    }

    const total = allBatches.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBatches = allBatches.slice(startIndex, endIndex);

    return {
      data: paginatedBatches,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener lote por ID
   */
  async getById(id: string): Promise<InventoryBatch> {
    const doc = await this.batchesCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Lote no encontrado");
    }

    return doc.data() as InventoryBatch;
  }

  /**
   * Actualizar lote
   */
  async update(
    id: string,
    data: UpdateInventoryBatchRequest
  ): Promise<InventoryBatch> {
    const batchDoc = await this.batchesCollection.doc(id).get();

    if (!batchDoc.exists) {
      throw new NotFoundError("Lote no encontrado");
    }

    const updates: Record<string, any> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (data.batch_number !== undefined) {
      updates.batch_number = data.batch_number?.trim() ?? null;
    }

    if (data.expiration_date !== undefined) {
      if (data.expiration_date) {
        const parsedDate = new Date(data.expiration_date);
        if (isNaN(parsedDate.getTime())) {
          throw new BadRequestError("Fecha de caducidad inválida");
        }
        updates.expiration_date = Timestamp.fromDate(parsedDate);
      } else {
        updates.expiration_date = null;
      }
    }

    if (data.notes !== undefined) {
      updates.notes = data.notes?.trim() ?? null;
    }

    await this.batchesCollection.doc(id).update(updates);

    const updatedDoc = await this.batchesCollection.doc(id).get();
    return updatedDoc.data() as InventoryBatch;
  }

  /**
   * Obtener stock actual de un producto (suma de todos los lotes)
   */
  async getProductStock(productId: string): Promise<ProductStock> {
    const productDoc = await this.productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    const batchesSnapshot = await this.batchesCollection
      .where("product_id", "==", productId)
      .where("current_quantity", ">", 0)
      .get();

    const batches = batchesSnapshot.docs.map(
      (doc) => doc.data() as InventoryBatch
    );

    const totalQuantity = batches.reduce(
      (sum, batch) => sum + batch.current_quantity,
      0
    );

    let oldestBatchDate: Date | undefined;
    let nearestExpirationDate: Date | undefined;

    if (batches.length > 0) {
      // Fecha del lote más antiguo
      const oldestBatch = batches.reduce((oldest, current) => {
        const oldestDate = (oldest.entry_date as any).toDate();
        const currentDate = (current.entry_date as any).toDate();
        return currentDate < oldestDate ? current : oldest;
      });
      oldestBatchDate = (oldestBatch.entry_date as any).toDate();

      // Fecha de caducidad más cercana
      const batchesWithExpiration = batches.filter((b) => b.expiration_date);
      if (batchesWithExpiration.length > 0) {
        const nearestBatch = batchesWithExpiration.reduce(
          (nearest, current) => {
            const nearestDate = (nearest.expiration_date as any).toDate();
            const currentDate = (current.expiration_date as any).toDate();
            return currentDate < nearestDate ? current : nearest;
          }
        );
        nearestExpirationDate = (nearestBatch.expiration_date as any).toDate();
      }
    }

    const result: ProductStock = {
      product_id: productId,
      total_quantity: totalQuantity,
      batches_count: batches.length,
    };

    // Solo agregar si tienen valor
    if (oldestBatchDate) {
      result.oldest_batch_date = oldestBatchDate;
    }

    if (nearestExpirationDate) {
      result.nearest_expiration_date = nearestExpirationDate;
    }

    return result;
  }

  /**
   * Obtener alertas de stock bajo
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const productsSnapshot = await this.productsCollection
      .where("is_active", "==", true)
      .get();

    const products = productsSnapshot.docs.map((doc) => doc.data());

    const alerts: LowStockAlert[] = [];

    for (const product of products) {
      const stock = await this.getProductStock(product.id);

      if (stock.total_quantity === 0) {
        alerts.push({
          product_id: product.id,
          product_name: product.name,
          current_stock: stock.total_quantity,
          min_sale_quantity: product.min_sale_quantity ?? 0,
          status: "critical",
        });
      } else if (stock.total_quantity < (product.min_sale_quantity ?? 0)) {
        alerts.push({
          product_id: product.id,
          product_name: product.name,
          current_stock: stock.total_quantity,
          min_sale_quantity: product.min_sale_quantity ?? 0,
          status: "warning",
        });
      }
    }

    return alerts.sort((a, b) => {
      if (a.status === "critical" && b.status !== "critical") return -1;
      if (a.status !== "critical" && b.status === "critical") return 1;
      return a.current_stock - b.current_stock;
    });
  }

  /**
   * Obtener alertas de productos próximos a caducar
   */
  async getExpiringProductsAlerts(
    daysThreshold = 7
  ): Promise<ExpiringProductAlert[]> {
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + daysThreshold * 24 * 60 * 60 * 1000
    );

    const batchesSnapshot = await this.batchesCollection
      .where("current_quantity", ">", 0)
      .get();

    const batches = batchesSnapshot.docs.map(
      (doc) => doc.data() as InventoryBatch
    );

    const alerts: ExpiringProductAlert[] = [];

    for (const batch of batches) {
      if (!batch.expiration_date) continue;

      const expDate = (batch.expiration_date as any).toDate();
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: "expired" | "critical" | "warning";
      if (diffDays < 0) {
        status = "expired";
      } else if (diffDays <= 3) {
        status = "critical";
      } else if (diffDays <= 7) {
        status = "warning";
      } else {
        continue; // No incluir si faltan más de 7 días
      }

      // Obtener nombre del producto
      const productDoc = await this.productsCollection
        .doc(batch.product_id)
        .get();
      const productName = productDoc.exists
        ? productDoc.data()?.name
        : "Producto desconocido";

      alerts.push({
        batch_id: batch.id,
        product_id: batch.product_id,
        product_name: productName,
        current_quantity: batch.current_quantity,
        expiration_date: expDate,
        days_until_expiration: diffDays,
        status,
      });
    }

    // Ordenar: expirados primero, luego críticos, luego warnings
    return alerts.sort((a, b) => {
      const statusOrder = { expired: 0, critical: 1, warning: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.days_until_expiration - b.days_until_expiration;
    });
  }

  /**
   * Actualizar cantidad de un lote (usado internamente por ajustes y ventas)
   */
  async updateQuantity(batchId: string, newQuantity: number): Promise<void> {
    if (newQuantity < 0) {
      throw new BadRequestError("La cantidad no puede ser negativa");
    }

    await this.batchesCollection.doc(batchId).update({
      current_quantity: newQuantity,
      updated_at: FieldValue.serverTimestamp(),
    });
  }
}
