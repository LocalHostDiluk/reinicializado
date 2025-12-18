import type { Request, Response, NextFunction } from "express";
import { InventoryAdjustmentService } from "../services/inventory-adjustment.service.js";
import type {
  CreateInventoryAdjustmentRequest,
  InventoryAdjustmentFilters,
} from "../models/inventory-adjustment.model.js";
import { AdjustmentType } from "../models/inventory-adjustment.model.js";

const adjustmentService = new InventoryAdjustmentService();

/**
 * POST /api/inventory/adjustments
 * Registrar ajuste de inventario
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateInventoryAdjustmentRequest = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    const adjustment = await adjustmentService.create(data, userId);

    res.status(201).json({
      status: "success",
      message: "Ajuste registrado exitosamente",
      data: adjustment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/adjustments
 * Listar ajustes con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros
    const filters: InventoryAdjustmentFilters = {};

    if (req.query.batch_id) {
      filters.batch_id = req.query.batch_id as string;
    }

    if (req.query.product_id) {
      filters.product_id = req.query.product_id as string;
    }

    if (
      req.query.adjustment_type &&
      Object.values(AdjustmentType).includes(
        req.query.adjustment_type as AdjustmentType
      )
    ) {
      filters.adjustment_type = req.query.adjustment_type as AdjustmentType;
    }

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
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

    const result = await adjustmentService.getAll(filters, paginationParams);

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
 * GET /api/inventory/adjustments/:id
 * Obtener ajuste por ID
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
        message: "ID de ajuste requerido",
      });
      return;
    }

    const adjustment = await adjustmentService.getById(id);

    res.status(200).json({
      status: "success",
      data: adjustment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/adjustments/batch/:batchId
 * Obtener ajustes de un lote específico
 */
export const getByBatchId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const batchId = req.params.batchId;

    if (!batchId) {
      res.status(400).json({
        status: "error",
        message: "ID de lote requerido",
      });
      return;
    }

    const adjustments = await adjustmentService.getByBatchId(batchId);

    res.status(200).json({
      status: "success",
      data: adjustments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inventory/adjustments/summary
 * Obtener resumen de ajustes
 */
export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: {
      product_id?: string;
      start_date?: string;
      end_date?: string;
    } = {};

    if (req.query.product_id) {
      filters.product_id = req.query.product_id as string;
    }

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    const summary = await adjustmentService.getAdjustmentsSummary(filters);

    res.status(200).json({
      status: "success",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
