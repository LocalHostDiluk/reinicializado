import { db } from '../config/firebase.js';
import type {
  InventoryAdjustment,
  CreateInventoryAdjustmentRequest,
  InventoryAdjustmentFilters,
} from '../models/inventory-adjustment.model.js';
import { AdjustmentType } from '../models/inventory-adjustment.model.js';
import { NotFoundError, BadRequestError } from '../utils/errors.util.js';
import { validateRequiredFields } from '../utils/validation.util.js';
import type { PaginatedResponse } from '../utils/pagination.util.js';
import { calculatePagination, normalizePagination } from '../utils/pagination.util.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { InventoryBatchService } from './inventory-batch.service.js';

export class InventoryAdjustmentService {
  private adjustmentsCollection = db.collection('inventory_adjustments');
  private batchesCollection = db.collection('inventory_batches');
  private batchService = new InventoryBatchService();

  /**
   * Crear ajuste de inventario
   */
  async create(data: CreateInventoryAdjustmentRequest, userId: string): Promise<InventoryAdjustment> {
    validateRequiredFields(data, ['batch_id', 'adjustment_type', 'quantity', 'reason']);

    // Verificar que el lote exista
    const batchDoc = await this.batchesCollection.doc(data.batch_id).get();
    if (!batchDoc.exists) {
      throw new NotFoundError('Lote no encontrado');
    }

    const batch = batchDoc.data();
    if (!batch) {
      throw new NotFoundError('Lote no encontrado');
    }

    // Validar cantidad
    if (data.quantity === 0) {
      throw new BadRequestError('La cantidad debe ser diferente de 0');
    }

    // Para mermas, la cantidad debe ser negativa
    if (
      (data.adjustment_type === AdjustmentType.WASTE_EXPIRED ||
        data.adjustment_type === AdjustmentType.WASTE_DAMAGED) &&
      data.quantity > 0
    ) {
      throw new BadRequestError('Las mermas deben tener cantidad negativa');
    }

    // Calcular nueva cantidad del lote
    const newQuantity = batch.current_quantity + data.quantity;

    // Validar que no se quede en negativo
    if (newQuantity < 0) {
      throw new BadRequestError(
        `No se puede ajustar. Stock actual: ${batch.current_quantity}, ajuste: ${data.quantity}`
      );
    }

    // Crear el ajuste
    const adjustmentRef = this.adjustmentsCollection.doc();
    const now = FieldValue.serverTimestamp();

    const adjustment = {
      id: adjustmentRef.id,
      batch_id: data.batch_id,
      product_id: batch.product_id,  // Denormalizado
      adjustment_type: data.adjustment_type,
      quantity: data.quantity,
      reason: data.reason.trim(),
      adjusted_by: userId,
      created_at: now,
    };

    // Usar transacción para garantizar consistencia
    await db.runTransaction(async (transaction) => {
      // Crear el ajuste
      transaction.set(adjustmentRef, adjustment);

      // Actualizar la cantidad del lote
      transaction.update(this.batchesCollection.doc(data.batch_id), {
        current_quantity: newQuantity,
        updated_at: FieldValue.serverTimestamp(),
      });
    });

    const createdDoc = await adjustmentRef.get();
    return createdDoc.data() as InventoryAdjustment;
  }

  /**
   * Listar ajustes con filtros y paginación
   */
  async getAll(
    filters: InventoryAdjustmentFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<InventoryAdjustment>> {
    const { page, limit } = normalizePagination(paginationParams);

    let query: FirebaseFirestore.Query = this.adjustmentsCollection;

    // Aplicar filtros
    if (filters.batch_id) {
      query = query.where('batch_id', '==', filters.batch_id);
    }

    if (filters.product_id) {
      query = query.where('product_id', '==', filters.product_id);
    }

    if (filters.adjustment_type) {
      query = query.where('adjustment_type', '==', filters.adjustment_type);
    }

    // Ordenar por fecha (más recientes primero)
    query = query.orderBy('created_at', 'desc');

    // Obtener todos los documentos
    const snapshot = await query.get();
    let allAdjustments = snapshot.docs.map(doc => doc.data() as InventoryAdjustment);

    // Filtrar por rango de fechas en memoria
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date ? new Date(filters.start_date) : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      if (startDate && isNaN(startDate.getTime())) {
        throw new BadRequestError('Fecha de inicio inválida');
      }

      if (endDate && isNaN(endDate.getTime())) {
        throw new BadRequestError('Fecha de fin inválida');
      }

      allAdjustments = allAdjustments.filter(adj => {
        const adjDate = (adj.created_at as any).toDate();

        if (startDate && adjDate < startDate) return false;
        if (endDate && adjDate > endDate) return false;

        return true;
      });
    }

    const total = allAdjustments.length;

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAdjustments = allAdjustments.slice(startIndex, endIndex);

    return {
      data: paginatedAdjustments,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener ajuste por ID
   */
  async getById(id: string): Promise<InventoryAdjustment> {
    const doc = await this.adjustmentsCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError('Ajuste no encontrado');
    }

    return doc.data() as InventoryAdjustment;
  }

  /**
   * Obtener ajustes de un lote específico
   */
  async getByBatchId(batchId: string): Promise<InventoryAdjustment[]> {
    const snapshot = await this.adjustmentsCollection
      .where('batch_id', '==', batchId)
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as InventoryAdjustment);
  }

  /**
   * Obtener resumen de ajustes por tipo
   */
  async getAdjustmentsSummary(filters: {
    product_id?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<{
    total_adjustments: number;
    by_type: Record<AdjustmentType, { count: number; total_quantity: number }>;
  }> {
    let query: FirebaseFirestore.Query = this.adjustmentsCollection;

    if (filters.product_id) {
      query = query.where('product_id', '==', filters.product_id);
    }

    const snapshot = await query.get();
    let adjustments = snapshot.docs.map(doc => doc.data() as InventoryAdjustment);

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date ? new Date(filters.start_date) : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      adjustments = adjustments.filter(adj => {
        const adjDate = (adj.created_at as any).toDate();
        if (startDate && adjDate < startDate) return false;
        if (endDate && adjDate > endDate) return false;
        return true;
      });
    }

    // Calcular resumen
    const byType: Record<AdjustmentType, { count: number; total_quantity: number }> = {
      [AdjustmentType.WASTE_EXPIRED]: { count: 0, total_quantity: 0 },
      [AdjustmentType.WASTE_DAMAGED]: { count: 0, total_quantity: 0 },
      [AdjustmentType.MANUAL_CORRECTION]: { count: 0, total_quantity: 0 },
    };

    adjustments.forEach(adj => {
      byType[adj.adjustment_type].count++;
      byType[adj.adjustment_type].total_quantity += Math.abs(adj.quantity);
    });

    return {
      total_adjustments: adjustments.length,
      by_type: byType,
    };
  }
}
