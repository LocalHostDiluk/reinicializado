import type { Request, Response, NextFunction } from "express";
import { SaleService } from "../services/sale.service.js";
import type { CreateSaleRequest, SaleFilters } from "../models/sale.model.js";
import { PaymentMethod } from "../models/sale.model.js";

const saleService = new SaleService();

/**
 * POST /api/sales
 * Crear venta
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateSaleRequest = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    const sale = await saleService.create(data, userId);

    res.status(201).json({
      status: "success",
      message: "Venta registrada exitosamente",
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sales
 * Listar ventas con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros
    const filters: SaleFilters = {};

    if (req.query.sold_by) {
      filters.sold_by = req.query.sold_by as string;
    }

    if (
      req.query.payment_method &&
      Object.values(PaymentMethod).includes(
        req.query.payment_method as PaymentMethod
      )
    ) {
      filters.payment_method = req.query.payment_method as PaymentMethod;
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

    const result = await saleService.getAll(filters, paginationParams);

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
 * GET /api/sales/:id
 * Obtener venta por ID
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
        message: "ID de venta requerido",
      });
      return;
    }

    const sale = await saleService.getById(id);

    res.status(200).json({
      status: "success",
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sales/stats
 * Obtener estadísticas de ventas
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
      sold_by?: string;
    } = {};

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    if (req.query.sold_by) {
      filters.sold_by = req.query.sold_by as string;
    }

    const stats = await saleService.getStats(filters);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
