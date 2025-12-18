import { db } from "../config/firebase.js";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../models/category.model.js";
import { NotFoundError, BadRequestError } from "../utils/errors.util.js";
import { validateRequiredFields } from "../utils/validation.util.js";
import { FieldValue } from "firebase-admin/firestore";

export class CategoryService {
  private categoriesCollection = db.collection("categories");

  /**
   * Crear categoría
   */
  async create(data: CreateCategoryRequest): Promise<Category> {
    validateRequiredFields(data, ["name"]);

    // Verificar que no exista una categoría con el mismo nombre
    const existingCategory = await this.categoriesCollection
      .where("name", "==", data.name.trim())
      .limit(1)
      .get();

    if (!existingCategory.empty) {
      throw new BadRequestError("Ya existe una categoría con ese nombre");
    }

    const categoryRef = this.categoriesCollection.doc();
    const now = FieldValue.serverTimestamp();

    const category = {
      id: categoryRef.id,
      name: data.name.trim(),
      created_at: now,
      updated_at: now,
    };

    await categoryRef.set(category);

    // Obtener el documento recién creado para retornar con timestamps reales
    const createdDoc = await categoryRef.get();
    return createdDoc.data() as Category;
  }

  /**
   * Listar todas las categorías
   */
  async getAll(): Promise<Category[]> {
    const snapshot = await this.categoriesCollection
      .orderBy("name", "asc")
      .get();

    return snapshot.docs.map((doc) => doc.data() as Category);
  }

  /**
   * Obtener categoría por ID
   */
  async getById(id: string): Promise<Category> {
    const doc = await this.categoriesCollection.doc(id).get();

    if (!doc.exists) {
      throw new NotFoundError("Categoría no encontrada");
    }

    return doc.data() as Category;
  }

  /**
   * Actualizar categoría
   */
  async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const categoryDoc = await this.categoriesCollection.doc(id).get();

    if (!categoryDoc.exists) {
      throw new NotFoundError("Categoría no encontrada");
    }

    // Si se está actualizando el nombre, verificar que no exista otra con ese nombre
    if (data.name) {
      const existingSnapshot = await this.categoriesCollection
        .where("name", "==", data.name.trim())
        .limit(1)
        .get();

      if (!existingSnapshot.empty && existingSnapshot.docs[0]?.id !== id) {
        throw new BadRequestError("Ya existe otra categoría con ese nombre");
      }
    }

    const updates: Record<string, any> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (data.name) {
      updates.name = data.name.trim();
    }

    await this.categoriesCollection.doc(id).update(updates);

    const updatedDoc = await this.categoriesCollection.doc(id).get();
    return updatedDoc.data() as Category;
  }

  /**
   * Eliminar categoría
   */
  async delete(id: string): Promise<void> {
    const categoryDoc = await this.categoriesCollection.doc(id).get();

    if (!categoryDoc.exists) {
      throw new NotFoundError("Categoría no encontrada");
    }

    // Verificar que no haya productos asociados
    const productsSnapshot = await db
      .collection("products")
      .where("category_id", "==", id)
      .limit(1)
      .get();

    if (!productsSnapshot.empty) {
      throw new BadRequestError(
        "No se puede eliminar la categoría porque tiene productos asociados"
      );
    }

    await this.categoriesCollection.doc(id).delete();
  }
}
