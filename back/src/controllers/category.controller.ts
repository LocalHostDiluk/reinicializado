import type { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service.js";
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../models/category.model.js";

const categoryService = new CategoryService();

/**
 * POST /api/categories
 * Crear nueva categoría
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateCategoryRequest = req.body;
    const category = await categoryService.create(data);

    res.status(201).json({
      status: "success",
      message: "Categoría creada exitosamente",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories
 * Listar todas las categorías
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categoryService.getAll();

    res.status(200).json({
      status: "success",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 * Obtener categoría por ID
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de categoría requerido",
      });
      return;
    }

    const category = await categoryService.getById(id);

    res.status(200).json({
      status: "success",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 * Actualizar categoría
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de categoría requerido",
      });
      return;
    }

    const data: UpdateCategoryRequest = req.body;
    const category = await categoryService.update(id, data);

    res.status(200).json({
      status: "success",
      message: "Categoría actualizada exitosamente",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 * Eliminar categoría
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de categoría requerido",
      });
      return;
    }

    await categoryService.delete(id);

    res.status(200).json({
      status: "success",
      message: "Categoría eliminada exitosamente",
    });
  } catch (error) {
    next(error);
  }
};
