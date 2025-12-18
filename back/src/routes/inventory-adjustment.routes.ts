import { Router } from "express";
import * as adjustmentController from "../controllers/inventory-adjustment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/inventory/adjustments
 * @desc    Registrar ajuste de inventario
 * @access  Private (Solo gerente)
 */
router.post("/", requireManager, adjustmentController.create);

/**
 * @route   GET /api/inventory/adjustments
 * @desc    Listar ajustes con filtros y paginación
 * @access  Private (Autenticado)
 * @query   batch_id, product_id, adjustment_type, start_date, end_date, page, limit
 */
router.get("/", adjustmentController.getAll);

// ⚠️ RUTAS ESPECÍFICAS PRIMERO

/**
 * @route   GET /api/inventory/adjustments/summary
 * @desc    Obtener resumen de ajustes
 * @access  Private (Autenticado)
 * @query   product_id, start_date, end_date
 */
router.get("/summary", adjustmentController.getSummary);

/**
 * @route   GET /api/inventory/adjustments/batch/:batchId
 * @desc    Obtener ajustes de un lote específico
 * @access  Private (Autenticado)
 */
router.get("/batch/:batchId", adjustmentController.getByBatchId);

// ⚠️ RUTAS CON PARÁMETROS AL FINAL

/**
 * @route   GET /api/inventory/adjustments/:id
 * @desc    Obtener ajuste por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", adjustmentController.getById);

export default router;
