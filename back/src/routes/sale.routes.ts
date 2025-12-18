import { Router } from "express";
import * as saleController from "../controllers/sale.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/sales
 * @desc    Crear venta
 * @access  Private (Autenticado)
 */
router.post("/", saleController.create);

/**
 * @route   GET /api/sales
 * @desc    Listar ventas con filtros y paginación
 * @access  Private (Autenticado)
 * @query   sold_by, payment_method, start_date, end_date, page, limit
 */
router.get("/", saleController.getAll);

/**
 * @route   GET /api/sales/stats
 * @desc    Obtener estadísticas de ventas
 * @access  Private (Autenticado)
 * @query   start_date, end_date, sold_by
 */
router.get("/stats", saleController.getStats);

/**
 * @route   GET /api/sales/:id
 * @desc    Obtener venta por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", saleController.getById);

export default router;
