import type { Request, Response, NextFunction } from "express";
import { PurchaseService } from "../services/purchase.service.js";
import type {
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  PurchaseFilters,
} from "../models/purchase.model.js";
import { PurchaseType, PurchaseStatus } from "../models/purchase.model.js";

const purchaseService = new PurchaseService();

/**
 * POST /api/purchases
 * Crear compra (solo gerente)
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreatePurchaseRequest = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    const purchase = await purchaseService.create(data, userId);

    res.status(201).json({
      status: "success",
      message: "Compra registrada exitosamente",
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/purchases/:id/mark-received
 * Marcar compra como recibida (crea lotes automáticamente) - Solo gerente
 */
export const markAsReceived = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de compra requerido",
      });
      return;
    }

    const purchase = await purchaseService.markAsReceived(id, userId);

    res.status(200).json({
      status: "success",
      message: "Compra marcada como recibida y lotes creados exitosamente",
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/purchases
 * Listar compras con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros
    const filters: PurchaseFilters = {};

    if (req.query.supplier_id) {
      filters.supplier_id = req.query.supplier_id as string;
    }

    if (
      req.query.purchase_type &&
      Object.values(PurchaseType).includes(
        req.query.purchase_type as PurchaseType
      )
    ) {
      filters.purchase_type = req.query.purchase_type as PurchaseType;
    }

    if (
      req.query.status &&
      Object.values(PurchaseStatus).includes(req.query.status as PurchaseStatus)
    ) {
      filters.status = req.query.status as PurchaseStatus;
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

    const result = await purchaseService.getAll(filters, paginationParams);

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
 * GET /api/purchases/:id
 * Obtener compra por ID
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
        message: "ID de compra requerido",
      });
      return;
    }

    const purchase = await purchaseService.getById(id);

    res.status(200).json({
      status: "success",
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/purchases/:id
 * Actualizar compra (solo gerente)
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const data: UpdatePurchaseRequest = req.body;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de compra requerido",
      });
      return;
    }

    const purchase = await purchaseService.update(id, data);

    res.status(200).json({
      status: "success",
      message: "Compra actualizada exitosamente",
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/purchases/:id
 * Cancelar compra (solo gerente)
 */
export const cancel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de compra requerido",
      });
      return;
    }

    await purchaseService.cancel(id);

    res.status(200).json({
      status: "success",
      message: "Compra cancelada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/purchases/stats
 * Obtener estadísticas de compras
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: {
      start_date?: string;
      end_date?: string;
      supplier_id?: string;
    } = {};

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    if (req.query.supplier_id) {
      filters.supplier_id = req.query.supplier_id as string;
    }

    const stats = await purchaseService.getStats(filters);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
