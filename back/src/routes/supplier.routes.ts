import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/suppliers
 * @desc    Crear nuevo proveedor
 * @access  Private (Solo gerente)
 */
router.post("/", requireManager, supplierController.create);

/**
 * @route   GET /api/suppliers
 * @desc    Listar proveedores con filtros y paginación
 * @access  Private (Autenticado)
 * @query   is_active, search, page, limit
 */
router.get("/", supplierController.getAll);

/**
 * @route   GET /api/suppliers/:id
 * @desc    Obtener proveedor por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", supplierController.getById);

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Actualizar proveedor
 * @access  Private (Solo gerente)
 */
router.put("/:id", requireManager, supplierController.update);

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Eliminar proveedor (soft delete)
 * @access  Private (Solo gerente)
 */
router.delete("/:id", requireManager, supplierController.deleteSupplier);

/**
 * @route   PATCH /api/suppliers/:id/toggle-active
 * @desc    Toggle proveedor activo/inactivo
 * @access  Private (Solo gerente)
 */
router.patch(
  "/:id/toggle-active",
  requireManager,
  supplierController.toggleActive
);

export default router;
