import { db } from "../config/firebase.js";
import type {
  PurchaseReturn,
  CreatePurchaseReturnRequest,
  PurchaseReturnFilters,
  PurchaseReturnItem,
} from "../models/purchase-return.model.js";
import type { Purchase } from "../models/purchase.model.js";
import type { InventoryBatch } from "../models/inventory-batch.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import type { PaginatedResponse } from "../utils/pagination.util.js";
import {
  calculatePagination,
  normalizePagination,
} from "../utils/pagination.util.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export class PurchaseReturnService {
  private returnsCollection = db.collection("purchase_returns");
  private purchasesCollection = db.collection("purchases");
  private batchesCollection = db.collection("inventory_batches");

  /**
   * Crear devolución
   */
  async create(
    data: CreatePurchaseReturnRequest,
    userId: string
  ): Promise<PurchaseReturn> {
    validateRequiredFields(data, ["purchase_id", "items", "return_type"]);

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError(
        "La devolución debe tener al menos un producto"
      );
    }

    // Verificar que la compra exista
    const purchaseDoc = await this.purchasesCollection
      .doc(data.purchase_id)
      .get();
    if (!purchaseDoc.exists) {
      throw new NotFoundError("Compra no encontrada");
    }

    const purchase = purchaseDoc.data() as Purchase;

    // Procesar items y validar
    const processedItems: PurchaseReturnItem[] = [];
    let totalRefund = 0;

    for (const item of data.items) {
      validateRequiredFields(item, ["batch_id", "quantity_returned", "reason"]);

      if (item.quantity_returned <= 0) {
        throw new BadRequestError("La cantidad devuelta debe ser mayor a 0");
      }

      // Obtener lote
      const batchDoc = await this.batchesCollection.doc(item.batch_id).get();
      if (!batchDoc.exists) {
        throw new NotFoundError(`Lote ${item.batch_id} no encontrado`);
      }

      const batch = batchDoc.data() as InventoryBatch;

      // Verificar que el lote pertenezca a la compra
      const purchaseItem = purchase.items.find(
        (pi) => pi.batch_id === item.batch_id
      );

      if (!purchaseItem) {
        throw new BadRequestError(
          `El lote ${item.batch_id} no pertenece a la compra ${purchase.purchase_number}`
        );
      }

      // Verificar que haya suficiente cantidad
      if (item.quantity_returned > batch.current_quantity) {
        throw new BadRequestError(
          `La cantidad devuelta (${item.quantity_returned}) excede el stock actual del lote (${batch.current_quantity})`
        );
      }

      const itemRefund = item.quantity_returned * batch.purchase_price;
      totalRefund += itemRefund;

      // Construir item dinámicamente
      const returnItem: any = {
        product_id: batch.product_id,
        product_name: purchaseItem.product_name,
        batch_id: item.batch_id,
        quantity_returned: item.quantity_returned,
        unit_cost: batch.purchase_price,
        subtotal: itemRefund,
        reason: item.reason,
      };

      if (item.notes) {
        returnItem.notes = item.notes.trim();
      }

      processedItems.push(returnItem as PurchaseReturnItem);
    }

    // Generar número de devolución
    const returnNumber = await this.generateReturnNumber();

    // Fecha de devolución
    let returnDate: Date;
    if (data.return_date) {
      returnDate = new Date(data.return_date);
      if (isNaN(returnDate.getTime())) {
        throw new BadRequestError("Fecha de devolución inválida");
      }
    } else {
      returnDate = new Date();
    }

    const returnRef = this.returnsCollection.doc();
    const now = FieldValue.serverTimestamp();

    // Usar transacción para actualizar lotes y crear devolución
    await db.runTransaction(async (transaction) => {
      // Actualizar stock de cada lote
      for (const item of processedItems) {
        const batchRef = this.batchesCollection.doc(item.batch_id);
        const batchDoc = await transaction.get(batchRef);
        const batch = batchDoc.data() as InventoryBatch;

        const newQuantity = batch.current_quantity - item.quantity_returned;

        transaction.update(batchRef, {
          current_quantity: newQuantity,
          updated_at: FieldValue.serverTimestamp(),
        });
      }

      // Crear devolución
      const returnData = {
        id: returnRef.id,
        return_number: returnNumber,
        purchase_id: data.purchase_id,
        purchase_number: purchase.purchase_number,
        supplier_id: purchase.supplier_id,
        supplier_name: purchase.supplier_name,
        items: processedItems,
        return_type: data.return_type,
        total_refund: totalRefund,
        return_date: Timestamp.fromDate(returnDate),
        created_by: userId,
        created_at: now,
      };

      transaction.set(returnRef, returnData);
    });

    // Obtener devolución creada
    const createdDoc = await returnRef.get();
    return createdDoc.data() as PurchaseReturn;
  }

  /**
   * Generar número de devolución único (DEV-YYYYMMDD-XXXX)
   */
  private async generateReturnNumber(): Promise<string> {
    const today = new Date();
    const isoDate = today.toISOString().split("T")[0];
    if (!isoDate) {
      throw new Error("Error generando número de devolución");
    }
    const dateStr = isoDate.replace(/-/g, "");

    // Contar devoluciones del día
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayReturnsSnapshot = await this.returnsCollection
      .where("created_at", ">=", Timestamp.fromDate(startOfDay))
      .where("created_at", "<=", Timestamp.fromDate(endOfDay))
      .get();

    const count = todayReturnsSnapshot.size + 1;
    const paddedCount = count.toString().padStart(4, "0");

    return `DEV-${dateStr}-${paddedCount}`;
  }

  /**
   * Listar devoluciones con filtros y paginación
   */
  async getAll(
    filters: PurchaseReturnFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<PurchaseReturn>> {
    const { page, limit } = normalizePagination(paginationParams);

    let query: FirebaseFirestore.Query = this.returnsCollection;

    // Aplicar filtros
    if (filters.purchase_id) {
      query = query.where("purchase_id", "==", filters.purchase_id);
    }

    if (filters.supplier_id) {
      query = query.where("supplier_id", "==", filters.supplier_id);
    }

    if (filters.return_type) {
      query = query.where("return_type", "==", filters.return_type);
    }

    // Ordenar por fecha (más recientes primero)
    query = query.orderBy("return_date", "desc");

    // Obtener documentos
    const snapshot = await query.get();
    let allReturns = snapshot.docs.map((doc) => doc.data() as PurchaseReturn);

    // Filtrar por rango de fechas en memoria
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      allReturns = allReturns.filter((returnDoc) => {
        const returnDate = (returnDoc.return_date as any).toDate();
        if (startDate && returnDate < startDate) return false;
        if (endDate && returnDate > endDate) return false;
        return true;
      });
    }

    const total = allReturns.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReturns = allReturns.slice(startIndex, endIndex);

    return {
      data: paginatedReturns,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener devolución por ID
   */
  async getById(id: string): Promise<PurchaseReturn> {
    const doc = await this.returnsCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Devolución no encontrada");
    }

    return doc.data() as PurchaseReturn;
  }

  /**
   * Obtener devoluciones de una compra
   */
  async getByPurchaseId(purchaseId: string): Promise<PurchaseReturn[]> {
    const snapshot = await this.returnsCollection
      .where("purchase_id", "==", purchaseId)
      .orderBy("return_date", "desc")
      .get();

    return snapshot.docs.map((doc) => doc.data() as PurchaseReturn);
  }
}
