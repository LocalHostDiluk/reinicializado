import type { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service.js";
import type {
  ReportDateFilter,
  TopProductsFilter,
  SlowMovingFilter,
  ExpiringFilter,
} from "../models/report.model.js";

const reportService = new ReportService();

/**
 * GET /api/reports/dashboard
 * Obtener métricas del dashboard general
 */
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const metrics = await reportService.getDashboardMetrics();

    res.status(200).json({
      status: "success",
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/sales/by-period
 * Ventas por período
 */
export const getSalesByPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: ReportDateFilter = {};

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    const report = await reportService.getSalesByPeriod(filters);

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/sales/comparison
 * Comparativa de ventas entre períodos
 */
export const getSalesComparison = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { current_start, current_end, previous_start, previous_end } =
      req.query;

    if (!current_start || !current_end || !previous_start || !previous_end) {
      res.status(400).json({
        status: "error",
        message:
          "Se requieren todas las fechas: current_start, current_end, previous_start, previous_end",
      });
      return;
    }

    const report = await reportService.getSalesComparison(
      current_start as string,
      current_end as string,
      previous_start as string,
      previous_end as string
    );

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/sales/top-products
 * Top productos más vendidos
 */
export const getTopSellingProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: TopProductsFilter = {};

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    if (req.query.limit) {
      const limit = parseInt(req.query.limit as string, 10);
      if (!isNaN(limit)) {
        filters.limit = limit;
      }
    }

    const report = await reportService.getTopSellingProducts(filters);

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/sales/by-payment-method
 * Ventas por método de pago
 */
export const getSalesByPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: ReportDateFilter = {};

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    const report = await reportService.getSalesByPaymentMethod(filters);

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/inventory/low-stock
 * Productos con bajo stock
 */
export const getLowStockProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const report = await reportService.getLowStockProducts();

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/inventory/expiring
 * Productos próximos a caducar
 */
export const getExpiringProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: ExpiringFilter = {};

    if (req.query.days) {
      const days = parseInt(req.query.days as string, 10);
      if (!isNaN(days)) {
        filters.days = days;
      }
    }

    const report = await reportService.getExpiringProducts(filters);

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/inventory/slow-moving
 * Productos que no rotan
 */
export const getSlowMovingProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: SlowMovingFilter = {};

    if (req.query.days_without_sales) {
      const days = parseInt(req.query.days_without_sales as string, 10);
      if (!isNaN(days)) {
        filters.days_without_sales = days;
      }
    }

    const report = await reportService.getSlowMovingProducts(filters);

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/waste/summary
 * Resumen de mermas
 */
export const getWasteSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters: ReportDateFilter = {};

    if (req.query.start_date) {
      filters.start_date = req.query.start_date as string;
    }

    if (req.query.end_date) {
      filters.end_date = req.query.end_date as string;
    }

    const report = await reportService.getWasteSummary(filters);

    res.status(200).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
