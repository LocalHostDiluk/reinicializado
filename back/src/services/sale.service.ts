import { db } from "../config/firebase.js";
import type {
  Sale,
  CreateSaleRequest,
  SaleItem,
  SaleFilters,
  SalesStats,
  SaleInventoryMovement,
} from "../models/sale.model.js";
import { PaymentMethod } from "../models/sale.model.js";
import type { InventoryBatch } from "../models/inventory-batch.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import type { PaginatedResponse } from "../utils/pagination.util.js";
import {
  calculatePagination,
  normalizePagination,
} from "../utils/pagination.util.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export class SaleService {
  private salesCollection = db.collection("sales");
  private productsCollection = db.collection("products");
  private batchesCollection = db.collection("inventory_batches");
  private movementsCollection = db.collection("sale_inventory_movements");

  /**
   * Crear venta con descuento automático de stock (FIFO)
   */
  async create(data: CreateSaleRequest, userId: string): Promise<Sale> {
    validateRequiredFields(data, ["items", "payment_method"]);

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError("La venta debe tener al menos un producto");
    }

    // Validar método de pago mixto
    if (data.payment_method === PaymentMethod.MIXED) {
      if (!data.payment_breakdown) {
        throw new BadRequestError("Pago mixto requiere payment_breakdown");
      }

      const breakdownSum =
        (data.payment_breakdown.cash || 0) +
        (data.payment_breakdown.card || 0) +
        (data.payment_breakdown.transfer || 0);

      // Validaremos la suma con el total después de calcularlo
      if (breakdownSum <= 0) {
        throw new BadRequestError(
          "La suma del payment_breakdown debe ser mayor a 0"
        );
      }

      // Validar que los montos sean positivos
      if (data.payment_breakdown.cash && data.payment_breakdown.cash < 0) {
        throw new BadRequestError("El monto en efectivo no puede ser negativo");
      }
      if (data.payment_breakdown.card && data.payment_breakdown.card < 0) {
        throw new BadRequestError("El monto con tarjeta no puede ser negativo");
      }
      if (
        data.payment_breakdown.transfer &&
        data.payment_breakdown.transfer < 0
      ) {
        throw new BadRequestError(
          "El monto por transferencia no puede ser negativo"
        );
      }
    }

    // Procesar items y validar stock
    const processedItems: SaleItem[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      validateRequiredFields(item, ["product_id", "quantity", "unit_price"]);

      if (item.quantity <= 0) {
        throw new BadRequestError("La cantidad debe ser mayor a 0");
      }

      if (item.unit_price < 0) {
        throw new BadRequestError("El precio unitario no puede ser negativo");
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

      if (!product.is_active) {
        throw new BadRequestError(`Producto ${product.name} no está activo`);
      }

      // Obtener lotes disponibles (FIFO: más antiguos primero)
      const batchesSnapshot = await this.batchesCollection
        .where("product_id", "==", item.product_id)
        .where("current_quantity", ">", 0)
        .orderBy("entry_date", "asc")
        .get();

      if (batchesSnapshot.empty) {
        throw new BadRequestError(`Sin stock disponible para ${product.name}`);
      }

      const availableBatches = batchesSnapshot.docs.map(
        (doc) => doc.data() as InventoryBatch
      );

      // Filtrar lotes no caducados
      const now = new Date();
      const validBatches = availableBatches.filter((batch) => {
        if (!batch.expiration_date) return true;
        const expDate = (batch.expiration_date as any).toDate();
        return expDate > now;
      });

      if (validBatches.length === 0) {
        throw new BadRequestError(
          `Sin stock válido (no caducado) para ${product.name}`
        );
      }

      // Calcular stock total disponible
      const totalStock = validBatches.reduce(
        (sum, batch) => sum + batch.current_quantity,
        0
      );

      if (totalStock < item.quantity) {
        throw new BadRequestError(
          `Stock insuficiente para ${product.name}. Disponible: ${totalStock}, Solicitado: ${item.quantity}`
        );
      }

      // Calcular subtotal del item
      const itemSubtotal = item.quantity * item.unit_price;
      subtotal += itemSubtotal;

      // Preparar item procesado (asignaremos lotes después en la transacción)
      processedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: itemSubtotal,
        sale_type: product.sale_type,
        batches_used: [], // Se llenará en la transacción
      });
    }

    // Calcular totales
    const discount = data.discount && data.discount > 0 ? data.discount : 0;
    const total = subtotal - discount;

    if (total < 0) {
      throw new BadRequestError("El descuento no puede ser mayor al subtotal");
    }

    // Validar suma de payment_breakdown si es pago mixto
    if (data.payment_method === PaymentMethod.MIXED && data.payment_breakdown) {
      const breakdownSum =
        (data.payment_breakdown.cash || 0) +
        (data.payment_breakdown.card || 0) +
        (data.payment_breakdown.transfer || 0);

      if (Math.abs(breakdownSum - total) > 0.01) {
        // Tolerancia de 1 centavo por redondeo
        throw new BadRequestError(
          `La suma del payment_breakdown ($${breakdownSum}) debe ser igual al total ($${total})`
        );
      }
    }

    // Generar número de venta
    const saleNumber = await this.generateSaleNumber();

    const saleRef = this.salesCollection.doc();
    const now = FieldValue.serverTimestamp();

    // Usar transacción para garantizar consistencia
    await db.runTransaction(async (transaction) => {
      // Procesar cada item y descontar stock (FIFO)
      for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];
        if (!item) continue;

        let remainingQuantity = item.quantity; // ← AGREGAR ESTA LÍNEA

        // Obtener lotes actualizados dentro de la transacción
        const batchesSnapshot = await transaction.get(
          this.batchesCollection
            .where("product_id", "==", item.product_id)
            .where("current_quantity", ">", 0)
            .orderBy("entry_date", "asc")
        );

        const batches = batchesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          data: doc.data() as InventoryBatch,
        }));

        // Descontar usando FIFO
        for (const batch of batches) {
          if (remainingQuantity <= 0) break;

          // Filtrar caducados
          if (batch.data.expiration_date) {
            const expDate = (batch.data.expiration_date as any).toDate();
            if (expDate <= now) continue;
          }

          const quantityToUse = Math.min(
            remainingQuantity,
            batch.data.current_quantity
          );
          const newQuantity = batch.data.current_quantity - quantityToUse;

          // Actualizar cantidad del lote
          transaction.update(batch.ref, {
            current_quantity: newQuantity,
            updated_at: FieldValue.serverTimestamp(),
          });

          // Registrar uso del lote
          item.batches_used.push({
            batch_id: batch.id,
            quantity_used: quantityToUse,
          });

          // Crear movimiento de inventario
          const movementRef = this.movementsCollection.doc();
          const movement: Omit<SaleInventoryMovement, "id"> = {
            sale_id: saleRef.id,
            batch_id: batch.id,
            product_id: item.product_id,
            quantity: -quantityToUse, // Negativo porque es salida
            created_at: now as any,
          };
          transaction.set(movementRef, { ...movement, id: movementRef.id });

          remainingQuantity -= quantityToUse;
        }

        if (remainingQuantity > 0) {
          throw new BadRequestError(
            `No se pudo descontar todo el stock para ${item.product_name}`
          );
        }
      }

      // Crear venta
      const saleData: any = {
        id: saleRef.id,
        sale_number: saleNumber,
        items: processedItems,
        subtotal,
        discount,
        total,
        payment_method: data.payment_method,
        sold_by: userId,
        created_at: now,
      };

      // Solo agregar payment_breakdown si existe
      if (data.payment_breakdown) {
        saleData.payment_breakdown = data.payment_breakdown;
      }

      transaction.set(saleRef, saleData);
    });

    // Obtener venta creada
    const createdDoc = await saleRef.get();
    return createdDoc.data() as Sale;
  }

  /**
   * Generar número de venta único (VENTA-YYYYMMDD-XXXX)
   */
  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const isoDate = today.toISOString().split("T")[0];
    if (!isoDate) {
      throw new Error("Error generando número de venta");
    }
    const dateStr = isoDate.replace(/-/g, "");

    // Contar ventas del día
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaySalesSnapshot = await this.salesCollection
      .where("created_at", ">=", Timestamp.fromDate(startOfDay))
      .where("created_at", "<=", Timestamp.fromDate(endOfDay))
      .get();

    const count = todaySalesSnapshot.size + 1;
    const paddedCount = count.toString().padStart(4, "0");

    return `VENTA-${dateStr}-${paddedCount}`;
  }

  /**
   * Listar ventas con filtros y paginación
   */
  async getAll(
    filters: SaleFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Sale>> {
    const { page, limit } = normalizePagination(paginationParams);

    let query: FirebaseFirestore.Query = this.salesCollection;

    // Aplicar filtros
    if (filters.sold_by) {
      query = query.where("sold_by", "==", filters.sold_by);
    }

    if (filters.payment_method) {
      query = query.where("payment_method", "==", filters.payment_method);
    }

    // Ordenar por fecha (más recientes primero)
    query = query.orderBy("created_at", "desc");

    // Obtener documentos
    const snapshot = await query.get();
    let allSales = snapshot.docs.map((doc) => doc.data() as Sale);

    // Filtrar por rango de fechas en memoria
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      allSales = allSales.filter((sale) => {
        const saleDate = (sale.created_at as any).toDate();
        if (startDate && saleDate < startDate) return false;
        if (endDate && saleDate > endDate) return false;
        return true;
      });
    }

    const total = allSales.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSales = allSales.slice(startIndex, endIndex);

    return {
      data: paginatedSales,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener venta por ID
   */
  async getById(id: string): Promise<Sale> {
    const doc = await this.salesCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Venta no encontrada");
    }

    return doc.data() as Sale;
  }

  /**
   * Obtener estadísticas de ventas
   */
  async getStats(
    filters: {
      start_date?: string;
      end_date?: string;
      sold_by?: string;
    } = {}
  ): Promise<SalesStats> {
    let query: FirebaseFirestore.Query = this.salesCollection;

    if (filters.sold_by) {
      query = query.where("sold_by", "==", filters.sold_by);
    }

    const snapshot = await query.get();
    let sales = snapshot.docs.map((doc) => doc.data() as Sale);

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      sales = sales.filter((sale) => {
        const saleDate = (sale.created_at as any).toDate();
        if (startDate && saleDate < startDate) return false;
        if (endDate && saleDate > endDate) return false;
        return true;
      });
    }

    // Calcular estadísticas
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItemsSold = sales.reduce((sum, sale) => {
      return (
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      );
    }, 0);

    // Por método de pago
    const paymentMethods: Record<
      PaymentMethod,
      { count: number; amount: number }
    > = {
      [PaymentMethod.CASH]: { count: 0, amount: 0 },
      [PaymentMethod.CARD]: { count: 0, amount: 0 },
      [PaymentMethod.TRANSFER]: { count: 0, amount: 0 },
      [PaymentMethod.MIXED]: { count: 0, amount: 0 },
    };

    sales.forEach((sale) => {
      paymentMethods[sale.payment_method].count++;
      paymentMethods[sale.payment_method].amount += sale.total;
    });

    return {
      total_sales: totalSales,
      total_amount: totalAmount,
      total_items_sold: totalItemsSold,
      payment_methods: paymentMethods,
    };
  }
}
