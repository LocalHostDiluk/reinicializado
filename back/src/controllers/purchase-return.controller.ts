import type { Request, Response, NextFunction } from "express";
import { PurchaseReturnService } from "../services/purchase-return.service.js";
import type {
  CreatePurchaseReturnRequest,
  PurchaseReturnFilters,
} from "../models/purchase-return.model.js";
import { ReturnType } from "../models/purchase-return.model.js";

const purchaseReturnService = new PurchaseReturnService();

/**
 * POST /api/purchases/returns
 * Crear devolución (solo gerente)
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreatePurchaseReturnRequest = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    const purchaseReturn = await purchaseReturnService.create(data, userId);

    res.status(201).json({
      status: "success",
      message: "Devolución registrada exitosamente",
      data: purchaseReturn,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/purchases/returns
 * Listar devoluciones con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros
    const filters: PurchaseReturnFilters = {};

    if (req.query.purchase_id) {
      filters.purchase_id = req.query.purchase_id as string;
    }

    if (req.query.supplier_id) {
      filters.supplier_id = req.query.supplier_id as string;
    }

    if (
      req.query.return_type &&
      Object.values(ReturnType).includes(req.query.return_type as ReturnType)
    ) {
      filters.return_type = req.query.return_type as ReturnType;
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

    const result = await purchaseReturnService.getAll(
      filters,
      paginationParams
    );

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
 * GET /api/purchases/returns/:id
 * Obtener devolución por ID
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
        message: "ID de devolución requerido",
      });
      return;
    }

    const purchaseReturn = await purchaseReturnService.getById(id);

    res.status(200).json({
      status: "success",
      data: purchaseReturn,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/purchases/:purchaseId/returns
 * Obtener devoluciones de una compra específica
 */
export const getByPurchaseId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const purchaseId = req.params.purchaseId;

    if (!purchaseId) {
      res.status(400).json({
        status: "error",
        message: "ID de compra requerido",
      });
      return;
    }

    const returns = await purchaseReturnService.getByPurchaseId(purchaseId);

    res.status(200).json({
      status: "success",
      data: returns,
    });
  } catch (error) {
    next(error);
  }
};
