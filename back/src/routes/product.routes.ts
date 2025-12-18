import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/products
 * @desc    Crear nuevo producto
 * @access  Private (Solo gerente)
 */
router.post("/", requireManager, productController.create);

/**
 * @route   GET /api/products
 * @desc    Listar productos con filtros y paginación
 * @access  Private (Autenticado)
 * @query   category_id, is_active, is_featured, sale_type, search, page, limit
 */
router.get("/", productController.getAll);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener producto por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", productController.getById);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar producto
 * @access  Private (Solo gerente)
 */
router.put("/:id", requireManager, productController.update);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Private (Solo gerente)
 */
router.delete("/:id", requireManager, productController.deleteProduct);

/**
 * @route   PATCH /api/products/:id/toggle-featured
 * @desc    Toggle producto destacado
 * @access  Private (Solo gerente)
 */
router.patch(
  "/:id/toggle-featured",
  requireManager,
  productController.toggleFeatured
);

/**
 * @route   PATCH /api/products/:id/toggle-active
 * @desc    Toggle producto activo/inactivo
 * @access  Private (Solo gerente)
 */
router.patch(
  "/:id/toggle-active",
  requireManager,
  productController.toggleActive
);

export default router;
