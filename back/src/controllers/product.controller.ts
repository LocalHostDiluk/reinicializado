import type { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service.js";
import type {
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
} from "../models/product.model.js";
import { SaleType } from "../models/product.model.js";

const productService = new ProductService();

/**
 * POST /api/products
 * Crear nuevo producto
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateProductRequest = req.body;
    const product = await productService.create(data);

    res.status(201).json({
      status: "success",
      message: "Producto creado exitosamente",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products
 * Listar productos con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros dinámicamente (solo agregar si están presentes)
    const filters: ProductFilters = {};

    if (req.query.category_id) {
      filters.category_id = req.query.category_id as string;
    }

    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === "true";
    }

    if (req.query.is_featured !== undefined) {
      filters.is_featured = req.query.is_featured === "true";
    }

    if (
      req.query.sale_type &&
      Object.values(SaleType).includes(req.query.sale_type as SaleType)
    ) {
      filters.sale_type = req.query.sale_type as SaleType;
    }

    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    // Construir parámetros de paginación
    const paginationParams: { page?: number; limit?: number } = {};

    if (req.query.page) {
      const page = parseInt(req.query.page as string, 10);
      if (!isNaN(page)) {
        paginationParams.page = page;
      }
    }

    if (req.query.limit) {
      const limit = parseInt(req.query.limit as string, 10);
      if (!isNaN(limit)) {
        paginationParams.limit = limit;
      }
    }

    const result = await productService.getAll(filters, paginationParams);

    res.status(200).json({
      status: "success",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Obtener producto por ID
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
        message: "ID de producto requerido",
      });
      return;
    }

    const product = await productService.getById(id);

    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Actualizar producto
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
        message: "ID de producto requerido",
      });
      return;
    }

    const data: UpdateProductRequest = req.body;
    const product = await productService.update(id, data);

    res.status(200).json({
      status: "success",
      message: "Producto actualizado exitosamente",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Eliminar producto (soft delete)
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de producto requerido",
      });
      return;
    }

    await productService.delete(id);

    res.status(200).json({
      status: "success",
      message: "Producto desactivado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/products/:id/toggle-featured
 * Toggle producto destacado
 */
export const toggleFeatured = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de producto requerido",
      });
      return;
    }

    const product = await productService.toggleFeatured(id);

    res.status(200).json({
      status: "success",
      message: `Producto ${
        product.is_featured
          ? "marcado como destacado"
          : "desmarcado como destacado"
      }`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/products/:id/toggle-active
 * Toggle producto activo/inactivo
 */
export const toggleActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de producto requerido",
      });
      return;
    }

    const product = await productService.toggleActive(id);

    res.status(200).json({
      status: "success",
      message: `Producto ${product.is_active ? "activado" : "desactivado"}`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
