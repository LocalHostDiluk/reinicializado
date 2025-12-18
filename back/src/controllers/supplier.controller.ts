import type { Request, Response, NextFunction } from "express";
import { SupplierService } from "../services/supplier.service.js";
import type {
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierFilters,
} from "../models/supplier.model.js";

const supplierService = new SupplierService();

/**
 * POST /api/suppliers
 * Crear nuevo proveedor
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateSupplierRequest = req.body;
    const supplier = await supplierService.create(data);

    res.status(201).json({
      status: "success",
      message: "Proveedor creado exitosamente",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/suppliers
 * Listar proveedores con filtros y paginación
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Construir filtros dinámicamente
    const filters: SupplierFilters = {};

    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === "true";
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

    const result = await supplierService.getAll(filters, paginationParams);

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
 * GET /api/suppliers/:id
 * Obtener proveedor por ID
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
        message: "ID de proveedor requerido",
      });
      return;
    }

    const supplier = await supplierService.getById(id);

    res.status(200).json({
      status: "success",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/suppliers/:id
 * Actualizar proveedor
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
        message: "ID de proveedor requerido",
      });
      return;
    }

    const data: UpdateSupplierRequest = req.body;
    const supplier = await supplierService.update(id, data);

    res.status(200).json({
      status: "success",
      message: "Proveedor actualizado exitosamente",
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/suppliers/:id
 * Eliminar proveedor (soft delete)
 */
export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        status: "error",
        message: "ID de proveedor requerido",
      });
      return;
    }

    await supplierService.delete(id);

    res.status(200).json({
      status: "success",
      message: "Proveedor desactivado exitosamente",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/suppliers/:id/toggle-active
 * Toggle proveedor activo/inactivo
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
        message: "ID de proveedor requerido",
      });
      return;
    }

    const supplier = await supplierService.toggleActive(id);

    res.status(200).json({
      status: "success",
      message: `Proveedor ${supplier.is_active ? "activado" : "desactivado"}`,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};
