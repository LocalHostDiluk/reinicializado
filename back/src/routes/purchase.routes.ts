import { Router } from "express";
import * as purchaseController from "../controllers/purchase.controller.js";
import * as purchaseReturnController from "../controllers/purchase-return.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/purchases
 * @desc    Crear compra
 * @access  Private (Manager only)
 */
router.post("/", requireManager, purchaseController.create);

/**
 * @route   PATCH /api/purchases/:id/mark-received
 * @desc    Marcar compra como recibida (crea lotes automáticamente)
 * @access  Private (Manager only)
 */
router.patch(
  "/:id/mark-received",
  requireManager,
  purchaseController.markAsReceived
);

/**
 * @route   GET /api/purchases
 * @desc    Listar compras con filtros y paginación
 * @access  Private (Autenticado)
 * @query   supplier_id, purchase_type, status, start_date, end_date, page, limit
 */
router.get("/", purchaseController.getAll);

/**
 * @route   GET /api/purchases/stats
 * @desc    Obtener estadísticas de compras
 * @access  Private (Autenticado)
 * @query   start_date, end_date, supplier_id
 */
router.get("/stats", purchaseController.getStats);

/**
 * @route   GET /api/purchases/:id
 * @desc    Obtener compra por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", purchaseController.getById);

/**
 * @route   PUT /api/purchases/:id
 * @desc    Actualizar compra
 * @access  Private (Manager only)
 */
router.put("/:id", requireManager, purchaseController.update);

/**
 * @route   DELETE /api/purchases/:id
 * @desc    Cancelar compra
 * @access  Private (Manager only)
 */
router.delete("/:id", requireManager, purchaseController.cancel);

/**
 * @route   POST /api/purchases/returns
 * @desc    Crear devolución
 * @access  Private (Manager only)
 */
router.post("/returns", requireManager, purchaseReturnController.create);

/**
 * @route   GET /api/purchases/returns
 * @desc    Listar devoluciones con filtros y paginación
 * @access  Private (Autenticado)
 * @query   purchase_id, supplier_id, return_type, start_date, end_date, page, limit
 */
router.get("/returns", purchaseReturnController.getAll);

/**
 * @route   GET /api/purchases/returns/:id
 * @desc    Obtener devolución por ID
 * @access  Private (Autenticado)
 */
router.get("/returns/:id", purchaseReturnController.getById);

/**
 * @route   GET /api/purchases/:purchaseId/returns
 * @desc    Obtener devoluciones de una compra específica
 * @access  Private (Autenticado)
 */
router.get("/:purchaseId/returns", purchaseReturnController.getByPurchaseId);

export default router;
