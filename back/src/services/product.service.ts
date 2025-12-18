import { db } from "../config/firebase.js";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  SaleType,
} from "../models/product.model.js";
import { NotFoundError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import {
  validateProductPricing,
  validatePriceValues,
} from "../utils/product-validation.util.js";
import type { PaginatedResponse } from "../utils/pagination.util.js";
import {
  calculatePagination,
  normalizePagination,
} from "../utils/pagination.util.js";
import { FieldValue } from "firebase-admin/firestore";

export class ProductService {
  private productsCollection = db.collection("products");
  private categoriesCollection = db.collection("categories");

  /**
   * Crear producto
   */
  async create(data: CreateProductRequest): Promise<Product> {
    // Validaciones básicas
    validateRequiredFields(data, ["name", "category_id", "sale_type"]);

    // Verificar que la categoría exista
    const categoryDoc = await this.categoriesCollection
      .doc(data.category_id)
      .get();
    if (!categoryDoc.exists) {
      throw new NotFoundError("Categoría no encontrada");
    }

    // Validar precios
    validatePriceValues({
      price_per_kg: data.price_per_kg,
      price_per_piece: data.price_per_piece,
      average_weight_per_piece: data.average_weight_per_piece,
      min_sale_quantity: data.min_sale_quantity,
    });

    // Validar configuración de precios según tipo de venta
    const pricingConfig: {
      sale_type: SaleType;
      price_per_kg?: number | null;
      price_per_piece?: number | null;
      calculate_piece_by_weight?: boolean;
    } = {
      sale_type: data.sale_type,
      calculate_piece_by_weight: data.calculate_piece_by_weight ?? true,
    };

    // Solo agregar propiedades si están definidas
    if (data.price_per_kg !== undefined) {
      pricingConfig.price_per_kg = data.price_per_kg;
    }
    if (data.price_per_piece !== undefined) {
      pricingConfig.price_per_piece = data.price_per_piece;
    }

    validateProductPricing(pricingConfig);

    const productRef = this.productsCollection.doc();
    const now = FieldValue.serverTimestamp();

    const product = {
      id: productRef.id,
      name: data.name.trim(),
      category_id: data.category_id,
      sale_type: data.sale_type,
      price_per_kg: data.price_per_kg ?? null,
      price_per_piece: data.price_per_piece ?? null,
      calculate_piece_by_weight: data.calculate_piece_by_weight ?? true,
      average_weight_per_piece: data.average_weight_per_piece ?? null,
      min_sale_quantity: data.min_sale_quantity ?? 0.1,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      image_url: data.image_url ?? null,
      created_at: now,
      updated_at: now,
    };

    await productRef.set(product);

    // Obtener el documento recién creado para retornar con timestamps reales
    const createdDoc = await productRef.get();
    return createdDoc.data() as Product;
  }

  /**
   * Listar productos con filtros y paginación
   */
  async getAll(
    filters: ProductFilters = {},
    paginationParams: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit } = normalizePagination(paginationParams);

    let query: FirebaseFirestore.Query = this.productsCollection;

    // Aplicar filtros
    if (filters.category_id) {
      query = query.where("category_id", "==", filters.category_id);
    }

    if (filters.is_active !== undefined) {
      query = query.where("is_active", "==", filters.is_active);
    }

    if (filters.is_featured !== undefined) {
      query = query.where("is_featured", "==", filters.is_featured);
    }

    if (filters.sale_type) {
      query = query.where("sale_type", "==", filters.sale_type);
    }

    // Ordenar por nombre
    query = query.orderBy("name", "asc");

    // Obtener todos los documentos
    const snapshot = await query.get();
    let allProducts = snapshot.docs.map((doc) => doc.data() as Product);

    // Filtro de búsqueda en memoria (temporal)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      allProducts = allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchLower)
      );
    }

    const total = allProducts.length;

    // Aplicar paginación en memoria
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = allProducts.slice(startIndex, endIndex);

    return {
      data: paginatedProducts,
      meta: calculatePagination(page, limit, total),
    };
  }

  /**
   * Obtener producto por ID
   */
  async getById(id: string): Promise<Product> {
    const doc = await this.productsCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    return doc.data() as Product;
  }

  /**
   * Actualizar producto
   */
  async update(id: string, data: UpdateProductRequest): Promise<Product> {
    const productDoc = await this.productsCollection.doc(id).get();

    if (!productDoc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    const currentProduct = productDoc.data() as Product;

    // Si se actualiza la categoría, verificar que exista
    if (data.category_id && data.category_id !== currentProduct.category_id) {
      const categoryDoc = await this.categoriesCollection
        .doc(data.category_id)
        .get();
      if (!categoryDoc.exists) {
        throw new NotFoundError("Categoría no encontrada");
      }
    }

    // Validar precios si se están actualizando
    if (data.price_per_kg !== undefined || data.price_per_piece !== undefined) {
      validatePriceValues({
        price_per_kg: data.price_per_kg,
        price_per_piece: data.price_per_piece,
      });
    }

    // Validar configuración de precios si se está cambiando el tipo de venta
    const newSaleType = data.sale_type ?? currentProduct.sale_type;
    const newPricePerKg =
      data.price_per_kg !== undefined
        ? data.price_per_kg
        : currentProduct.price_per_kg;
    const newPricePerPiece =
      data.price_per_piece !== undefined
        ? data.price_per_piece
        : currentProduct.price_per_piece;
    const newCalculateByWeight =
      data.calculate_piece_by_weight !== undefined
        ? data.calculate_piece_by_weight
        : currentProduct.calculate_piece_by_weight;

    const pricingConfig: {
      sale_type: SaleType;
      price_per_kg?: number | null;
      price_per_piece?: number | null;
      calculate_piece_by_weight?: boolean;
    } = {
      sale_type: newSaleType,
      calculate_piece_by_weight: newCalculateByWeight,
    };

    // Solo agregar propiedades si están definidas
    if (newPricePerKg !== undefined && newPricePerKg !== null) {
      pricingConfig.price_per_kg = newPricePerKg;
    }
    if (newPricePerPiece !== undefined && newPricePerPiece !== null) {
      pricingConfig.price_per_piece = newPricePerPiece;
    }

    validateProductPricing(pricingConfig);

    const updates: Record<string, any> = {
      ...data,
      updated_at: FieldValue.serverTimestamp(),
    };

    if (data.name) {
      updates.name = data.name.trim();
    }

    await this.productsCollection.doc(id).update(updates);

    const updatedDoc = await this.productsCollection.doc(id).get();
    return updatedDoc.data() as Product;
  }

  /**
   * Eliminar producto (soft delete)
   */
  async delete(id: string): Promise<void> {
    const productDoc = await this.productsCollection.doc(id).get();

    if (!productDoc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    // Soft delete: solo marcamos como inactivo
    await this.productsCollection.doc(id).update({
      is_active: false,
      updated_at: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Toggle producto destacado
   */
  async toggleFeatured(id: string): Promise<Product> {
    const productDoc = await this.productsCollection.doc(id).get();

    if (!productDoc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    const product = productDoc.data() as Product;

    await this.productsCollection.doc(id).update({
      is_featured: !product.is_featured,
      updated_at: FieldValue.serverTimestamp(),
    });

    const updatedDoc = await this.productsCollection.doc(id).get();
    return updatedDoc.data() as Product;
  }

  /**
   * Toggle producto activo/inactivo
   */
  async toggleActive(id: string): Promise<Product> {
    const productDoc = await this.productsCollection.doc(id).get();

    if (!productDoc.exists) {
      throw new NotFoundError("Producto no encontrado");
    }

    const product = productDoc.data() as Product;

    await this.productsCollection.doc(id).update({
      is_active: !product.is_active,
      updated_at: FieldValue.serverTimestamp(),
    });

    const updatedDoc = await this.productsCollection.doc(id).get();
    return updatedDoc.data() as Product;
  }
}
