import type { Request, Response, NextFunction } from "express";
import { InventoryBatchService } from "../services/inventory-batch.service.js";
import type {
  CreateInventoryBatchRequest,
  UpdateInventoryBatchRequest,
  InventoryBatchFilters,
} from "../models/inventory-batch.model.js";

const batchService = new InventoryBatchService();

/**
 * POST /api/inventory/batches
 * Registrar entrada de mercancía (crear lote)
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateInventoryBatchRequest = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    const batch = await batchService.create(data, userId);

    res.status(201).json({
      status: "success",
      message: "Lote registrado exitosamente",
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/batches
 * Listar lotes con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros
    const filters: InventoryBatchFilters = {};

    if (req.query.product_id) {
      filters.product_id = req.query.product_id as string;
    }

    if (req.query.supplier_id) {
      filters.supplier_id = req.query.supplier_id as string;
    }

    if (req.query.has_stock !== undefined) {
      filters.has_stock = req.query.has_stock === "true";
    }

    if (req.query.expiring_in_days) {
      const days = parseInt(req.query.expiring_in_days as string, 10);
      if (!isNaN(days)) {
        filters.expiring_in_days = days;
      }
    }

    // Paginación
    const paginationParams: { page?: number; limit?: number } = {};

    if (req.query.page) {
      const page = parseInt(req.query.page as string, 10);
      if (!isNaN(page)) {
        paginationParams.page = page;
      }
    }

    if (req.query.limit) {
      const limit = parseInt(req.query.limit as string, 10);
      if (!isNaN(limit)) {
        paginationParams.limit = limit;
      }
    }

    const result = await batchService.getAll(filters, paginationParams);

    res.status(200).json({
      status: "success",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/batches/:id
 * Obtener lote por ID
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de lote requerido",
      });
      return;
    }

    const batch = await batchService.getById(id);

    res.status(200).json({
      status: "success",
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/inventory/batches/:id
 * Actualizar lote
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de lote requerido",
      });
      return;
    }

    const data: UpdateInventoryBatchRequest = req.body;
    const batch = await batchService.update(id, data);

    res.status(200).json({
      status: "success",
      message: "Lote actualizado exitosamente",
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/stock/:productId
 * Obtener stock actual de un producto
 */
export const getProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.productId;

    if (!productId) {
      res.status(400).json({
        status: "error",
        message: "ID de producto requerido",
      });
      return;
    }

    const stock = await batchService.getProductStock(productId);

    res.status(200).json({
      status: "success",
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/alerts/low-stock
 * Obtener alertas de stock bajo
 */
export const getLowStockAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const alerts = await batchService.getLowStockAlerts();

    res.status(200).json({
      status: "success",
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/alerts/expiring
 * Obtener alertas de productos próximos a caducar
 */
export const getExpiringAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Días de umbral (default: 7)
    let daysThreshold = 7;
    if (req.query.days) {
      const days = parseInt(req.query.days as string, 10);
      if (!isNaN(days) && days > 0) {
        daysThreshold = days;
      }
    }

    const alerts = await batchService.getExpiringProductsAlerts(daysThreshold);

    res.status(200).json({
      status: "success",
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};
