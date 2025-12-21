import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   GET /api/reports/dashboard
 * @desc    Obtener métricas del dashboard general
 * @access  Private (Autenticado)
 */
router.get("/dashboard", reportController.getDashboard);

/**
 * @route   GET /api/reports/sales/by-period
 * @desc    Ventas por período
 * @access  Private (Autenticado)
 * @query   start_date, end_date
 */
router.get("/sales/by-period", reportController.getSalesByPeriod);

/**
 * @route   GET /api/reports/sales/comparison
 * @desc    Comparativa de ventas entre períodos
 * @access  Private (Autenticado)
 * @query   current_start, current_end, previous_start, previous_end
 */
router.get("/sales/comparison", reportController.getSalesComparison);

/**
 * @route   GET /api/reports/sales/top-products
 * @desc    Top productos más vendidos
 * @access  Private (Autenticado)
 * @query   start_date, end_date, limit
 */
router.get("/sales/top-products", reportController.getTopSellingProducts);

/**
 * @route   GET /api/reports/sales/by-payment-method
 * @desc    Ventas por método de pago
 * @access  Private (Autenticado)
 * @query   start_date, end_date
 */
router.get(
  "/sales/by-payment-method",
  reportController.getSalesByPaymentMethod
);

/**
 * @route   GET /api/reports/inventory/low-stock
 * @desc    Productos con bajo stock
 * @access  Private (Autenticado)
 */
router.get("/inventory/low-stock", reportController.getLowStockProducts);

/**
 * @route   GET /api/reports/inventory/expiring
 * @desc    Productos próximos a caducar
 * @access  Private (Autenticado)
 * @query   days (default: 7)
 */
router.get("/inventory/expiring", reportController.getExpiringProducts);

/**
 * @route   GET /api/reports/inventory/slow-moving
 * @desc    Productos que no rotan
 * @access  Private (Autenticado)
 * @query   days_without_sales (default: 30)
 */
router.get("/inventory/slow-moving", reportController.getSlowMovingProducts);

/**
 * @route   GET /api/reports/waste/summary
 * @desc    Resumen de mermas
 * @access  Private (Autenticado)
 * @query   start_date, end_date
 */
router.get("/waste/summary", reportController.getWasteSummary);

export default router;
