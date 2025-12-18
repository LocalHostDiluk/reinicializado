import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @route   POST /auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 */
router.post("/refresh", authController.refresh);

/**
 * @route   POST /auth/verify-manager
 * @desc    Verificar credenciales de gerente para operaciones sensibles
 * @access  Public (pero requiere credenciales válidas de gerente)
 */
router.post("/verify-manager", authController.verifyManager);

/**
 * @route   GET /auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private (requiere token válido)
 */
router.get("/profile", authMiddleware, authController.getProfile);

export default router;
