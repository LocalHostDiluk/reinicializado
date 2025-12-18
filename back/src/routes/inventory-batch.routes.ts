import { Router } from "express";
import * as batchController from "../controllers/inventory-batch.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/inventory/batches
 * @desc    Registrar entrada de mercancía (crear lote)
 * @access  Private (Solo gerente)
 */
router.post("/", requireManager, batchController.create);

/**
 * @route   GET /api/inventory/batches
 * @desc    Listar lotes con filtros y paginación
 * @access  Private (Autenticado)
 * @query   product_id, supplier_id, has_stock, expiring_in_days, page, limit
 */
router.get("/", batchController.getAll);

// ⚠️ RUTAS ESPECÍFICAS PRIMERO (antes de /:id)

/**
 * @route   GET /api/inventory/batches/alerts/low-stock
 * @desc    Obtener alertas de stock bajo
 * @access  Private (Autenticado)
 */
router.get("/alerts/low-stock", batchController.getLowStockAlerts);

/**
 * @route   GET /api/inventory/batches/alerts/expiring
 * @desc    Obtener alertas de productos próximos a caducar
 * @access  Private (Autenticado)
 * @query   days (opcional, default: 7)
 */
router.get("/alerts/expiring", batchController.getExpiringAlerts);

/**
 * @route   GET /api/inventory/batches/stock/:productId
 * @desc    Obtener stock actual de un producto
 * @access  Private (Autenticado)
 */
router.get("/stock/:productId", batchController.getProductStock);

// ⚠️ RUTAS CON PARÁMETROS AL FINAL

/**
 * @route   GET /api/inventory/batches/:id
 * @desc    Obtener lote por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", batchController.getById);

/**
 * @route   PUT /api/inventory/batches/:id
 * @desc    Actualizar lote
 * @access  Private (Solo gerente)
 */
router.put("/:id", requireManager, batchController.update);

export default router;
