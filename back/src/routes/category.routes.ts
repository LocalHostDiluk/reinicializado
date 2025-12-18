import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @route   POST /api/categories
 * @desc    Crear nueva categoría
 * @access  Private (Solo gerente)
 */
router.post("/", requireManager, categoryController.create);

/**
 * @route   GET /api/categories
 * @desc    Listar todas las categorías
 * @access  Private (Autenticado)
 */
router.get("/", categoryController.getAll);

/**
 * @route   GET /api/categories/:id
 * @desc    Obtener categoría por ID
 * @access  Private (Autenticado)
 */
router.get("/:id", categoryController.getById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Actualizar categoría
 * @access  Private (Solo gerente)
 */
router.put("/:id", requireManager, categoryController.update);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Eliminar categoría
 * @access  Private (Solo gerente)
 */
router.delete("/:id", requireManager, categoryController.deleteCategory);

export default router;
